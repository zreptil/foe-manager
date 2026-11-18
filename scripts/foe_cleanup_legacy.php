<?php
declare(strict_types=1);
/** CLI only: list all City Builder cities, optionally delete one exact document with confirmation. */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit(1); }
const PROJECT_ID = 'foe-city-builder';
const ACCOUNT_EMAIL = 'andi@zreptil.de';

function requestJson(string $url, string $method = 'GET', ?string $bearer = null, ?array $form = null): array {
    $ch = curl_init($url);
    if ($ch === false) throw new RuntimeException('cURL initialization failed');
    $headers = ['Accept: application/json'];
    if ($bearer !== null) $headers[] = 'Authorization: Bearer ' . $bearer;
    if ($form !== null) $headers[] = 'Content-Type: application/x-www-form-urlencoded';
    $opts = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => $headers, CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2];
    if ($form !== null) $opts[CURLOPT_POSTFIELDS] = http_build_query($form);
    $ca = getenv('FOE_CA_BUNDLE') ?: '';
    if ($ca !== '') {
        if (!is_file($ca)) throw new RuntimeException('CA certificate file not found');
        $opts[CURLOPT_CAINFO] = $ca;
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    if ($raw === false) {
        $err = curl_error($ch); curl_close($ch);
        throw new RuntimeException('Network error: ' . $err);
    }
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = $raw === '' ? [] : json_decode((string)$raw, true);
    if (!is_array($data)) throw new RuntimeException('Invalid JSON response (HTTP ' . $status . ')');
    if ($status === 404 && $method === 'GET') return ['documents' => []];
    if ($status < 200 || $status >= 300) {
        $msg = (string)($data['error']['message'] ?? 'Request failed');
        throw new RuntimeException('HTTP ' . $status . ': ' . $msg);
    }
    return $data;
}

try {
    $authPath = getenv('FOE_FIREBASE_AUTH_FILE') ?: '';
    if ($authPath === '' || !is_file($authPath)) {
        throw new RuntimeException('Set FOE_FIREBASE_AUTH_FILE to your private .firebase-andi-auth.json file');
    }
    $auth = json_decode((string)file_get_contents($authPath), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($auth) || strcasecmp((string)($auth['email'] ?? ''), ACCOUNT_EMAIL) !== 0 || empty($auth['uid'])) {
        throw new RuntimeException('Wrong Firebase account: expected ' . ACCOUNT_EMAIL);
    }
    $apiKey = (string)($auth['apiKey'] ?? '');
    $refreshToken = (string)($auth['refreshToken'] ?? '');
    $idToken = (string)($auth['idToken'] ?? '');
    if ($refreshToken !== '') {
        if ($apiKey === '') throw new RuntimeException('apiKey missing in auth file');
        // Always refresh: browser-exported files need not contain expiresAt.
        $r = requestJson('https://securetoken.googleapis.com/v1/token?key=' . rawurlencode($apiKey), 'POST', null,
            ['grant_type' => 'refresh_token', 'refresh_token' => $refreshToken]);
        $idToken = (string)($r['id_token'] ?? '');
        if ($idToken === '') throw new RuntimeException('Firebase token refresh returned no id_token');
        // Keep the refreshed credentials only in memory. The original file is unchanged.
    } elseif ($idToken === '') {
        throw new RuntimeException('No idToken or refreshToken in auth file');
    }
    $base = 'https://firestore.googleapis.com/v1/projects/' . PROJECT_ID
        . '/databases/(default)/documents/users/' . rawurlencode((string)$auth['uid']) . '/cities';
    $documents = [];
    $pageToken = '';
    do {
        $query = ['pageSize' => 100];
        if ($pageToken !== '') $query['pageToken'] = $pageToken;
        $data = requestJson($base . '?' . http_build_query($query), 'GET', $idToken);
        foreach (($data['documents'] ?? []) as $doc) {
            if (!is_array($doc) || empty($doc['name'])) continue;
            $id = rawurldecode(basename((string)$doc['name']));
            $documents[$id] = [
                'name' => (string)($doc['fields']['name']['stringValue'] ?? '(kein Name)'),
                'updateTime' => (string)($doc['updateTime'] ?? '')
            ];
        }
        $pageToken = (string)($data['nextPageToken'] ?? '');
    } while ($pageToken !== '');
    ksort($documents, SORT_NATURAL | SORT_FLAG_CASE);
    echo 'Firebase-Konto: ' . ACCOUNT_EMAIL . PHP_EOL;
    echo 'Stadtdokumente: ' . count($documents) . PHP_EOL . PHP_EOL;
    foreach ($documents as $id => $info) {
        echo 'ID: ' . $id . PHP_EOL . '  Name: ' . $info['name'] . PHP_EOL;
    }
    if (!$documents) echo '(Keine Stadtdokumente gefunden)' . PHP_EOL;

    $target = null;
    $confirmation = null;
    foreach (array_slice($argv, 1) as $arg) {
        if (str_starts_with($arg, '--delete=')) $target = substr($arg, strlen('--delete='));
        if (str_starts_with($arg, '--confirm=')) $confirmation = substr($arg, strlen('--confirm='));
    }
    if ($target === null) {
        echo PHP_EOL . 'Nur Vorschau. Einzelnes Dokument loeschen mit:' . PHP_EOL;
        echo '  --delete="EXAKTE_ID" --confirm="EXAKTE_ID"' . PHP_EOL;
        exit(0);
    }
    if ($target === '' || $target !== $confirmation || !array_key_exists($target, $documents)) {
        throw new RuntimeException('Deletion refused: document ID not found or confirmation does not match');
    }
    $info = $documents[$target];
    if ($info['updateTime'] === '') throw new RuntimeException('Deletion refused: updateTime missing');
    $deleteUrl = $base . '/' . rawurlencode($target) . '?' . http_build_query([
        'currentDocument.updateTime' => $info['updateTime']
    ]);
    requestJson($deleteUrl, 'DELETE', $idToken);
    echo PHP_EOL . 'Deleted document: ' . $target . PHP_EOL;
} catch (Throwable $e) {
    fwrite(STDERR, 'Fehler: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
