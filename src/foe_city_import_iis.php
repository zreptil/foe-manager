<?php
declare(strict_types=1);
// POST-only JSON endpoint. Protect it behind your own authenticated backend; do not expose publicly.
const API_KEY = 'AIzaSyBbMRsspxk66lTfUl74VvvaHy04rI9spKU';
const PROJECT_ID = 'foe-city-builder';
// Private storage is configured with FOE_FIREBASE_AUTH_FILE outside the IIS site root.
// No hard-coded path: different Windows installations can use different directories.
const LOGIN_BASE = 'https://de-play.forgeofempires.com';
const PORTAL_BASE = 'https://de0.forgeofempires.com';
const SIGNATURE_SALT = 'TXavcG8rnIS343GCpbhQjLk4zFMcKnt4SXk90Y73b+PWTgtiaNhnJjlAVF9qX1QXSQU696MkskA59cKzHWxHhA==';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
ini_set('display_errors', '0');


/** Stable, language-independent error contract for the Angular client. */
final class ImportApiException extends RuntimeException
{
  public function __construct(
    public readonly string $apiCode,
    public readonly string $category,
    public readonly bool   $retryable = false,
    public readonly array  $details = [],
    public readonly int    $httpStatus = 500,
    ?Throwable             $previous = null
  )
  {
    parent::__construct($apiCode, 0, $previous);
  }
}

function importError(string $code, string $category, int $status = 500,
                     bool   $retryable = false, array $details = []): never
{
  throw new ImportApiException($code, $category, $retryable, $details, $status);
}

/** Fallback for unexpected errors; never send internal exception messages to the browser. */
function publicImportError(Throwable $error): array
{
  if ($error instanceof ImportApiException) {
    return ['code' => $error->apiCode, 'category' => $error->category,
      'retryable' => $error->retryable, 'details' => $error->details];
  }
  if ($error instanceof JsonException) {
    return ['code' => 'INVALID_JSON', 'category' => 'REQUEST',
      'retryable' => false, 'details' => []];
  }
  return ['code' => 'INTERNAL_ERROR', 'category' => 'SERVER',
    'retryable' => false, 'details' => []];
}

function api(string $url, ?array $payload = null, ?string $bearer = null): array
{
  $ch = curl_init($url);
  $headers = ['Accept: application/json'];
  if ($payload !== null) $headers[] = 'Content-Type: application/json';
  if ($bearer !== null) $headers[] = 'Authorization: Bearer ' . $bearer;
  $options = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25, CURLOPT_HTTPHEADER => $headers,
    CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2];
  if ($payload !== null) {
    $options[CURLOPT_POST] = true;
    $options[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_THROW_ON_ERROR);
  }
  $ca = getenv('FOE_CA_BUNDLE') ?: '';
  if (is_file($ca)) $options[CURLOPT_CAINFO] = $ca;
  curl_setopt_array($ch, $options);
  $raw = curl_exec($ch);
  if ($raw === false) {
    $error = curl_error($ch);
    curl_close($ch);
    throw new ImportApiException('FIREBASE_UNREACHABLE', 'FIREBASE', true, [], 502);
  }
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $json = json_decode($raw, true);
  if (!is_array($json)) importError('FIREBASE_INVALID_RESPONSE', 'FIREBASE', 502, true);
  if ($status >= 400) {
    $msg = $json['error']['message'] ?? ('HTTP ' . $status);
    throw new ImportApiException($status === 404 ? 'FIREBASE_DOCUMENT_NOT_FOUND' : ($status === 401 || $status === 403 ? 'FIREBASE_ACCESS_DENIED' : ($status === 409 || $status === 412 ? 'FIREBASE_CONFLICT' : 'FIREBASE_REQUEST_FAILED')), 'FIREBASE', $status >= 500 || $status === 429, [], $status === 404 ? 404 : ($status === 409 || $status === 412 ? 409 : 502));
  }
  return $json;
}

function firestoreUrl(string $uid, string $city = ''): string
{
  $base = 'https://firestore.googleapis.com/v1/projects/' . PROJECT_ID
    . '/databases/(default)/documents/users/' . rawurlencode($uid) . '/cities';
  return $city === '' ? $base : $base . '/' . rawurlencode($city);
}

/** Preserve Firestore Value object wrappers after json_decode(..., true).
 * Empty JSON objects become PHP [], which json_encode would incorrectly emit as [].
 */

function fv(mixed $v): array
{
  if (is_bool($v)) return ['booleanValue' => $v];
  if (is_int($v)) return ['integerValue' => (string)$v];
  if (is_float($v)) return ['doubleValue' => $v];
  if (is_string($v)) return ['stringValue' => $v];
  if ($v === null) return ['nullValue' => null];
  if (!is_array($v)) importError('FIREBASE_VALUE_INVALID', 'CONVERSION');
  if (array_is_list($v)) return ['arrayValue' => ['values' => array_map('fv', $v)]];
  $fields = [];
  foreach ($v as $k => $value) $fields[(string)$k] = fv($value);
  return ['mapValue' => ['fields' => $fields ?: new stdClass()]];
}

function fromFv(array $v): mixed
{
  foreach (['stringValue', 'booleanValue', 'doubleValue', 'nullValue'] as $k) if (array_key_exists($k, $v)) return $v[$k];
  if (isset($v['integerValue'])) return (int)$v['integerValue'];
  if (isset($v['arrayValue'])) return array_map('fromFv', $v['arrayValue']['values'] ?? []);
  if (isset($v['mapValue'])) {
    $out = [];
    foreach (($v['mapValue']['fields'] ?? []) as $k => $f) $out[$k] = fromFv($f);
    return $out;
  }
  importError('FIREBASE_VALUE_INVALID', 'CONVERSION');
}

/** Build an accurate, non-destructive geometry preview from all FoE unlocked rectangles.
 * Coordinates use the established axis swap and horizontal reflection.
 * We deliberately do not guess the City Builder expansion-bit ordering.
 */

function analyzeCityGeometry(array $city, array $metadata): array
{
  $areas = $city['unlocked_areas'] ?? [];
  if (!$areas) importError('FOE_AREAS_MISSING', 'CONVERSION');
  $minX = PHP_INT_MAX;
  $minY = PHP_INT_MAX;
  $maxX = PHP_INT_MIN;
  $maxY = PHP_INT_MIN;
  foreach ($areas as $a) {
    $x = (int)($a['x'] ?? 0);
    $y = (int)($a['y'] ?? 0);
    $w = (int)($a['width'] ?? 0);
    $l = (int)($a['length'] ?? 0);
    if ($w <= 0 || $l <= 0) importError('FOE_AREA_INVALID', 'CONVERSION');
    $minX = min($minX, $x);
    $minY = min($minY, $y);
    $maxX = max($maxX, $x + $w);
    $maxY = max($maxY, $y + $l);
  }
  $width = $maxX - $minX;
  $height = $maxY - $minY;
  // Use a sparse set of 4x4 expansion blocks, retaining holes.
  $tiles = [];
  foreach ($areas as $a) {
    $x = (int)$a['x'];
    $y = (int)$a['y'];
    $w = (int)$a['width'];
    $l = (int)$a['length'];
    if (($x - $minX) % 4 || ($y - $minY) % 4 || $w % 4 || $l % 4)
      importError('FOE_AREA_ALIGNMENT_INVALID', 'CONVERSION');
    for ($tx = $x; $tx < $x + $w; $tx += 4) for ($ty = $y; $ty < $y + $l; $ty += 4)
      $tiles[$tx . ':' . $ty] = true;
  }
  $contains = function (int $x, int $y, int $w, int $h) use ($areas): bool {
    // Check each cell, so L-shaped unlocked regions are handled correctly.
    for ($xx = $x; $xx < $x + $w; $xx++) for ($yy = $y; $yy < $y + $h; $yy++) {
      $inside = false;
      foreach ($areas as $a) if ($xx >= (int)$a['x'] && $xx < (int)$a['x'] + (int)$a['width']
        && $yy >= (int)$a['y'] && $yy < (int)$a['y'] + (int)$a['length']) {
        $inside = true;
        break;
      }
      if (!$inside) return false;
    }
    return true;
  };
  $roads = [];
  $buildings = [];
  $townhall = null;
  $unknown = [];
  $outside = [];
  $ignored = [];
  foreach (($city['entities'] ?? []) as $entity) {
    $type = (string)($entity['type'] ?? '');
    if (in_array($type, ['off_grid', 'friends_tavern', 'outpost_ship'], true)) {
      $ignored[$type] = ($ignored[$type] ?? 0) + 1;
      continue;
    }
    $fx = (int)($entity['x'] ?? 0);
    $fy = (int)($entity['y'] ?? 0);
    if ($type === 'street') {
      if (!$contains($fx, $fy, 1, 1)) $outside[] = 'Straße bei ' . $fx . ',' . $fy;
      $roads[] = ['x' => $height - ($fy - $minY) - 1, 'y' => $fx - $minX];
      continue;
    }
    $id = (string)($entity['cityentity_id'] ?? '');
    $m = $metadata[$id] ?? null;
    if (!$m || !is_numeric($m['width'] ?? null) || !is_numeric($m['length'] ?? null)
      || $m['width'] <= 0 || $m['length'] <= 0) {
      $unknown[] = $id;
      continue;
    }
    $fw = (int)$m['width'];
    $fl = (int)$m['length'];
    if (!$contains($fx, $fy, $fw, $fl)) $outside[] = $id . ' bei ' . $fx . ',' . $fy;
    $bw = $fl;
    $bh = $fw;
    $bx = $height - ($fy - $minY) - $bw;
    $by = $fx - $minX;
    if ($type === 'main_building') {
      $townhall = ['name' => 'Townhall Set', 'width' => $bw, 'height' => $bh,
        's' => ['x' => $bx, 'y' => $by],
        'buildings' => [['width' => $bw, 'height' => $bh, 'offset' => ['x' => 0, 'y' => 0], 'isTownhall' => true]]];
    } else {
      $item = ['name' => (string)($m['name'] ?? $id), 'width' => $bw, 'height' => $bh,
        's' => ['x' => $bx, 'y' => $by]];
      if (!empty($m['roadRequired'])) $item['roadRequired'] = true;
      $buildings[] = $item;
    }
  }
  $mappedTiles = [];
  foreach (array_keys($tiles) as $key) {
    [$tx, $ty] = array_map('intval', explode(':', $key));
    $mappedTiles[] = ['x' => intdiv($height - ($ty - $minY) - 4, 4), 'y' => intdiv($tx - $minX, 4)];
  }
  usort($mappedTiles, static fn($a, $b) => [$a['y'], $a['x']] <=> [$b['y'], $b['x']]);
  return ['width' => $height, 'height' => $width, 'minFoEX' => $minX, 'minFoEY' => $minY,
    'areaCount' => count($areas), 'expansionTiles' => $mappedTiles,
    'roads' => $roads, 'buildings' => $buildings, 'townhall' => $townhall,
    'unknown' => array_values(array_unique($unknown)), 'outside' => $outside, 'ignored' => $ignored];
}

function convertCity(array $export, array $metadata, array $reference, string $name): array
{
  $city = $export['city_map'] ?? $export;
  $g = analyzeCityGeometry($city, $metadata);
  if ($g['unknown']) importError('FOE_METADATA_MISSING', 'CONVERSION', 422, false, ['buildingIds' => array_slice($g['unknown'], 0, 30)]);
  if ($g['outside']) importError('FOE_BUILDINGS_OUTSIDE_AREA', 'CONVERSION', 422, false, ['count' => count($g['outside'])]);
  if (!$g['townhall']) importError('FOE_TOWNHALL_MISSING', 'CONVERSION', 422);
  if ($g['width'] % 4 !== 0 || $g['height'] % 4 !== 0) {
    importError('FOE_CITY_DIMENSIONS_INVALID', 'CONVERSION', 422);
  }
  $cols = intdiv($g['width'], 4);
  $rows = intdiv($g['height'], 4);
  // Der City Builder akzeptiert nach den Rastertests nur quadratische Masken.
  $squareSize = max($cols, $rows);
  $expansions = array_fill(0, $squareSize * $squareSize, false);
  foreach ($g['expansionTiles'] as $tile) {
    $x = (int)$tile['x'];
    $y = (int)$tile['y'];
    if ($x < 0 || $x >= $cols || $y < 0 || $y >= $rows) {
      importError('FOE_EXPANSION_OUT_OF_BOUNDS', 'CONVERSION', 422);
    }
    // Verified against the 4x4 -> 5x5 resize test: the second axis grows
    // by one and existing indices move from x*4+y to x*5+(y+1).
    $expansions[$x * $squareSize + $y] = true;
  }
  if (count(array_filter($expansions)) !== count($g['expansionTiles'])) {
    importError('FOE_EXPANSION_DUPLICATE', 'CONVERSION', 422);
  }
  $ref = $reference;
  $ref['name'] = $name;
  $ref['townhallSet'] = $g['townhall'];
  $ref['buildings'] = $g['buildings'];
  $ref['buildingSets'] = [];
  $ref['impedimentSet'] = [];
  $ref['expansions'] = $expansions;
  $ref['cityResult'] = ['solution' => true, 'emptyCells' => 0, 'streetPositions' => [],
    'optimized' => false, 'partialSolution' => false, 'workers' => 0, 'solverTime' => 0,
    'stopped' => false, 'optimizerTime' => 0, 'roadPositions' => $g['roads']];
  return $ref;
}

function firebaseAuthFile(): string
{
  $file = getenv('FOE_FIREBASE_AUTH_FILE');
  if (!is_string($file) || trim($file) === '') importError('FIREBASE_AUTH_CONFIG_MISSING', 'CONFIGURATION');
  $file = trim($file);
  if (!is_file($file)) importError('FIREBASE_AUTH_FILE_MISSING', 'CONFIGURATION');
  return $file;
}

function loadAuth(): ?array
{
  if (!is_file(firebaseAuthFile())) return null;
  $data = json_decode((string)file_get_contents(firebaseAuthFile()), true);
  return is_array($data) ? $data : null;
}

function saveAuth(array $auth): void
{
  $data = json_encode($auth, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
  if (file_put_contents(firebaseAuthFile(), $data, LOCK_EX) === false) importError('FIREBASE_AUTH_FILE_NOT_WRITABLE', 'CONFIGURATION');
  @chmod(firebaseAuthFile(), 0600);
}

function refreshAuth(array $auth): array
{
  if (($auth['expiresAt'] ?? 0) > time() + 120) return $auth;
  if (empty($auth['refreshToken'])) importError('FIREBASE_REFRESH_TOKEN_MISSING', 'CONFIGURATION');
  $ch = curl_init('https://securetoken.googleapis.com/v1/token?key=' . rawurlencode(API_KEY));
  $ca = getenv('FOE_CA_BUNDLE') ?: '';
  $opts = [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 25,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_POSTFIELDS => http_build_query(['grant_type' => 'refresh_token', 'refresh_token' => $auth['refreshToken']]),
    CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2];
  if (is_file($ca)) $opts[CURLOPT_CAINFO] = $ca;
  curl_setopt_array($ch, $opts);
  $raw = curl_exec($ch);
  if ($raw === false) {
    $err = curl_error($ch);
    curl_close($ch);
    throw new ImportApiException('FIREBASE_REFRESH_NETWORK_ERROR', 'FIREBASE', true, [], 502);
  }
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $r = json_decode($raw, true);
  if ($status >= 400 || !is_array($r) || empty($r['id_token'])) importError('FIREBASE_REFRESH_FAILED', 'FIREBASE', 502, $status >= 500 || $status === 429);
  $auth['idToken'] = $r['id_token'];
  $auth['refreshToken'] = $r['refresh_token'] ?? $auth['refreshToken'];
  $auth['expiresAt'] = time() + (int)($r['expires_in'] ?? 3600);
  saveAuth($auth);
  return $auth;
}

function resolveWorld(string $requested, array $worlds): array
{
  $requested = trim($requested);
  $matches = [];
  foreach ($worlds as $entry) {
    if (!is_array($entry)) continue;
    $id = $entry['id'] ?? null;
    $name = $entry['name'] ?? null;
    if (!is_string($id) || !preg_match('/^de[0-9]+$/i', $id) ||
      !is_string($name) || trim($name) === '') continue;
    if (strcasecmp($requested, $id) === 0 ||
      strtolower($requested) === strtolower(trim($name))) {
      $matches[strtolower($id)] = ['id' => strtolower($id), 'name' => trim($name)];
    }
  }
  if (count($matches) === 1) return reset($matches);
  if (count($matches) > 1) importError('FOE_WORLD_AMBIGUOUS', 'INPUT', 400);
  importError('FOE_WORLD_NOT_FOUND', 'INPUT', 400);
}

function request(string $url, string $cookieFile, string $method = 'GET', ?string $body = null, array $headers = []): array
{
  $ch = curl_init($url);
  if ($ch === false) {
    importError('FOE_NETWORK_ERROR', 'FOE', 502, true);
  }
  $options = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_COOKIEFILE => $cookieFile,
    CURLOPT_COOKIEJAR => $cookieFile,
    CURLOPT_ENCODING => '',
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HTTPHEADER => array_merge(['Accept: */*'], $headers),
  ];
  $ca = getenv('FOE_CA_BUNDLE') ?: '';
  if ($ca !== '') {
    if (!is_file($ca)) importError('CA_BUNDLE_MISSING', 'CONFIGURATION');
    $options[CURLOPT_CAINFO] = $ca;
  }
  if ($method === 'POST') {
    $options[CURLOPT_POST] = true;
    $options[CURLOPT_POSTFIELDS] = $body ?? '';
  }
  curl_setopt_array($ch, $options);
  $result = curl_exec($ch);
  if ($result === false) {
    $error = curl_error($ch);
    curl_close($ch);
    importError('FOE_NETWORK_ERROR', 'FOE', 502, true);
  }
  $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  $effectiveUrl = (string)curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
  curl_close($ch);
  if ($status < 200 || $status >= 300) {
    $requestHost = (string)(parse_url($effectiveUrl, PHP_URL_HOST) ?: '');
    if ($requestHost === 'de-play.forgeofempires.com' && str_contains($effectiveUrl, '/api/login')
      && in_array($status, [400, 401, 403], true)) {
      importError('FOE_LOGIN_REJECTED', 'AUTHENTICATION', 401);
    }
    importError('FOE_HTTP_ERROR', 'FOE', 502, $status >= 500 || $status === 429,
      ['upstreamStatus' => $status]);
  }
  return ['body' => (string)$result, 'url' => $effectiveUrl, 'status' => $status];
}

function jsonObject(string $text, string $context): array
{
  $value = json_decode($text, true, 512, JSON_THROW_ON_ERROR);
  if (!is_array($value)) {
    importError('FOE_INVALID_RESPONSE', 'FOE', 502);
  }
  return $value;
}

function portalAction(string $action, string $cookieFile, string $json): array
{
  $url = PORTAL_BASE . '/start/index?action=' . rawurlencode($action);
  $res = request($url, $cookieFile, 'POST', http_build_query(['json' => $json]), [
    'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
    'Origin: ' . PORTAL_BASE,
    'Referer: ' . PORTAL_BASE . '/page/',
    'X-Requested-With: XMLHttpRequest',
  ]);
  return jsonObject($res['body'], $action);
}

function extractGateway(string $html, string $world): string
{
  // The game page exposes a gatewayUrl in its initialization script.
  if (!preg_match('~gatewayUrl\s*:\s*[\'\"](https://[^\'\"]+/game/json\?h=[A-Za-z0-9_-]+)[\'\"]~', $html, $matches)) {
    importError('FOE_GATEWAY_NOT_FOUND', 'FOE', 502);
  }
  $url = $matches[1];
  $host = parse_url($url, PHP_URL_HOST);
  if ($host !== $world . '.forgeofempires.com') {
    importError('FOE_GATEWAY_HOST_INVALID', 'FOE', 502);
  }
  return $url;
}

function startupPayload(): string
{
  // StartupService.getData is read-only. No viewport logging is required for the data request.
  return json_encode([[
    '__class__' => 'ServerRequest',
    'requestData' => [],
    'requestClass' => 'StartupService',
    'requestMethod' => 'getData',
    'requestId' => 1,
  ]], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
}

/** Find the versioned lookup URL in the current game-server response. */

function findLookupUrl(mixed $node): ?string
{
  if (!is_array($node)) {
    return null;
  }
  if (($node['identifier'] ?? null) === 'building_entity_lookup'
    && isset($node['url']) && is_string($node['url'])) {
    return $node['url'];
  }
  foreach ($node as $value) {
    $found = findLookupUrl($value);
    if ($found !== null) {
      return $found;
    }
  }
  return null;
}

/** Only accept the public German FoE metadata endpoint, never arbitrary URLs from JSON. */

function validateMetadataUrl(string $url): string
{
  $parts = parse_url($url);
  if (!is_array($parts)
    || ($parts['scheme'] ?? '') !== 'https'
    || ($parts['host'] ?? '') !== 'foede.innogamescdn.com'
    || ($parts['path'] ?? '') !== '/start/metadata') {
    importError('FOE_METADATA_URL_INVALID', 'FOE', 502);
  }
  parse_str($parts['query'] ?? '', $query);
  if (!isset($query['id']) || !is_string($query['id'])
    || !preg_match('/^[A-Za-z0-9_]+-[a-f0-9]{32,64}$/', $query['id'])) {
    importError('FOE_METADATA_VERSION_INVALID', 'FOE', 502);
  }
  return $url;
}

function saveJson(string $path, mixed $value): void
{
  $json = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
    | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
  if (file_put_contents($path, $json, LOCK_EX) === false) {
    importError('TEMP_FILE_WRITE_FAILED', 'SERVER');
  }
}

/** Cache files are named by the versioned CDN id, so changed metadata refreshes itself. */

function metadataGet(string $url, string $cookieFile, string $cacheDir): array
{
  validateMetadataUrl($url);
  parse_str((string)parse_url($url, PHP_URL_QUERY), $query);
  $filename = $cacheDir . DIRECTORY_SEPARATOR . $query['id'] . '.json';
  if (is_file($filename)) {
    try {
      return jsonObject((string)file_get_contents($filename), $filename);
    } catch (Throwable $e) {
      @unlink($filename);
    }
  }
  $result = jsonObject(request($url, $cookieFile)['body'], $url);
  saveJson($filename, $result);
  return $result;
}

/** Index entries can be nested; gather only identifier/url records. */

function indexUrls(mixed $node, array &$urls): void
{
  if (!is_array($node)) {
    return;
  }
  if (isset($node['identifier'], $node['url'])
    && is_string($node['identifier']) && is_string($node['url'])) {
    $urls[$node['identifier']] = $node['url'];
  }
  foreach ($node as $value) {
    if (is_array($value)) {
      indexUrls($value, $urls);
    }
  }
}

/** Resolve the exact cityentity_id, allowing the index's building_entity_ prefix. */

function definitionUrl(string $cityEntityId, array $urls): ?string
{
  foreach ([$cityEntityId, 'building_entity_' . $cityEntityId] as $key) {
    if (isset($urls[$key])) {
      return $urls[$key];
    }
  }
  return null;
}

/** Supports both classic definitions and component-based event buildings. */

function extractBuildingMetadata(array $definition, string $id, string $url): ?array
{
  $size = $definition['components']['AllAge']['placement']['size'] ?? [];
  $width = $definition['width'] ?? $size['x'] ?? null;
  $length = $definition['length'] ?? $size['y'] ?? null;
  $name = $definition['name'] ?? null;
  if (!is_string($name) || trim($name) === ''
    || !is_numeric($width) || !is_numeric($length)
    || (int)$width <= 0 || (int)$length <= 0) {
    return null;
  }

  $type = $definition['type'] ?? null;
  if (!is_string($type) || $type === '') {
    foreach (($definition['components']['AllAge']['tags']['tags'] ?? []) as $tag) {
      if (is_array($tag) && ($tag['tag'] ?? null) === 'buildingType') {
        $type = $tag['buildingType'] ?? null;
        break;
      }
    }
  }

  // Missing requirements do not prove that a road is unnecessary.
  $roadRequired = array_key_exists('street_connection_level', $definition['requirements'] ?? [])
    ? ((int)$definition['requirements']['street_connection_level'] > 0)
    : null;

  return [
    'id' => $definition['id'] ?? $id,
    'name' => $name,
    'type' => $type,
    'width' => (int)$width,
    'length' => (int)$length,
    'roadRequired' => $roadRequired,
    'metadataUrl' => $url,
  ];
}

function exportMetadata(array $responses, array $startup, array $city, string $cookieFile, string $outputPath): void
{
  $lookupUrl = findLookupUrl($startup) ?? findLookupUrl($responses);
  if ($lookupUrl === null) {
    importError('FOE_METADATA_LOOKUP_MISSING', 'FOE', 502);
  }
  $cacheDir = getenv('FOE_METADATA_CACHE') ?: sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'foe-metadata-cache';
  if (!is_dir($cacheDir) && !mkdir($cacheDir, 0700, true) && !is_dir($cacheDir)) {
    importError('METADATA_CACHE_UNAVAILABLE', 'SERVER');
  }

  $index = metadataGet($lookupUrl, $cookieFile, $cacheDir);
  $urls = [];
  indexUrls($index, $urls);
  if ($urls === []) {
    importError('FOE_METADATA_LOOKUP_INVALID', 'FOE', 502);
  }
  $entityIds = [];
  foreach ($city['entities'] as $entity) {
    if (!is_array($entity) || !isset($entity['cityentity_id']) || !is_string($entity['cityentity_id'])) {
      continue;
    }
    $entityIds[$entity['cityentity_id']] = true;
  }

  $definitions = [];
  $unresolved = [];
  foreach (array_keys($entityIds) as $id) {
    $url = definitionUrl($id, $urls);
    if ($url === null) {
      $unresolved[] = ['cityentity_id' => $id, 'reason' => 'not present in building_entity_lookup'];
      continue;
    }
    try {
      $definition = metadataGet($url, $cookieFile, $cacheDir);
      $metadata = extractBuildingMetadata($definition, $id, $url);
      if ($metadata === null) {
        $unresolved[] = ['cityentity_id' => $id, 'reason' => 'definition lacks usable name or dimensions'];
        continue;
      }
      $definitions[$id] = $metadata;
    } catch (Throwable $error) {
      $unresolved[] = ['cityentity_id' => $id, 'reason' => $error->getMessage()];
    }
  }
  saveJson($outputPath, [
    'exportedAt' => gmdate('c'),
    'lookupUrl' => $lookupUrl,
    'lookupEntries' => count($urls),
    'buildings' => $definitions,
    'unresolved' => $unresolved,
  ]);

}

function exportCity(string $username, string $password, string $worldName, string $workDir): array
{
  $world = $worldName;
  $out = $workDir . '/city.json';
  $cookieFile = tempnam(sys_get_temp_dir(), 'foe_cookie_');
  if ($cookieFile === false) {
    importError('TEMP_FILE_CREATE_FAILED', 'SERVER');
  }
  try {

    request(LOGIN_BASE . '/?ref=master-page-login', $cookieFile);


    $login = request(LOGIN_BASE . '/api/login', $cookieFile, 'POST', json_encode([
      'username' => $username,
      'password' => $password,
      'useRememberMe' => true,
    ], JSON_THROW_ON_ERROR), [
      'Content-Type: application/json',
      'Origin: ' . LOGIN_BASE,
      'Referer: ' . LOGIN_BASE . '/?ref=master-page-login',
    ]);
    $loginData = jsonObject($login['body'], 'login');
    $redirect = $loginData['redirectUrl'] ?? null;
    if (!is_string($redirect) || !str_starts_with($redirect, 'https://de0.forgeofempires.com/')) {
      importError('FOE_LOGIN_FAILED', 'AUTHENTICATION', 401);
    }
    request($redirect, $cookieFile);


    $worlds = portalAction('fetch_worlds_for_login_page', $cookieFile, 'null');
    $resolvedWorld = resolveWorld($worldName, $worlds['worlds'] ?? []);
    $world = $resolvedWorld['id'];
    $resolvedWorldName = $resolvedWorld['name'];
    $enter = portalAction('play_now_login', $cookieFile, json_encode(['world_id' => $world], JSON_THROW_ON_ERROR));
    $loginUrl = $enter['login_url'] ?? null;
    if (!is_string($loginUrl) || parse_url($loginUrl, PHP_URL_HOST) !== $world . '.forgeofempires.com') {
      importError('FOE_WORLD_ENTRY_FAILED', 'FOE', 502);
    }
    $game = request($loginUrl, $cookieFile);
    $gateway = extractGateway($game['body'], $world);
    $hash = (string)parse_url($gateway, PHP_URL_QUERY);
    parse_str($hash, $query);
    $h = $query['h'] ?? null;
    if (!is_string($h) || $h === '') {
      importError('FOE_GATEWAY_TOKEN_MISSING', 'FOE', 502);
    }


    $payload = startupPayload();
    $signature = substr(md5($h . SIGNATURE_SALT . $payload), 1, 10);
    $response = request($gateway, $cookieFile, 'POST', $payload, [
      'Content-Type: application/json',
      'Origin: https://' . $world . '.forgeofempires.com',
      'Referer: https://' . $world . '.forgeofempires.com/game/index?ref=master-page-login',
      'Client-Identification: version=1.347; requiredVersion=1.347; platform=bro; platformType=html5; platformVersion=web',
      'Signature: ' . $signature,
    ]);
    $responses = jsonObject($response['body'], 'game response');
    $startup = null;
    foreach ($responses as $item) {
      if (($item['requestClass'] ?? '') === 'StartupService' && ($item['requestMethod'] ?? '') === 'getData') {
        $startup = $item['responseData'] ?? null;
        break;
      }
    }
    if (!is_array($startup)) {
      $classes = array_map(static fn($item) => ($item['requestClass'] ?? '?') . '.' . ($item['requestMethod'] ?? '?'), $responses);
      importError('FOE_STARTUP_MISSING', 'FOE', 502);
    }
    $city = $startup['city_map'] ?? null;
    if (!is_array($city) || !isset($city['entities']) || !is_array($city['entities'])) {
      importError('FOE_CITY_DATA_MISSING', 'FOE', 502);
    }


    $export = [
      'world' => $world,
      'exportedAt' => gmdate('c'),
      'entities' => $city['entities'],
      'unlocked_areas' => $city['unlocked_areas'] ?? [],
      'city_map' => $city,
    ];
    $encoded = json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    if (file_put_contents($out, $encoded) === false) {
      importError('TEMP_FILE_WRITE_FAILED', 'SERVER');
    }

    $metadataOut = $workDir . '/metadata.json';
    exportMetadata($responses, $startup, $city, $cookieFile, $metadataOut);
    return ['export' => $export, 'metadata' => jsonObject((string)file_get_contents($metadataOut), 'metadata'), 'world' => $world, 'worldName' => $resolvedWorldName];
  } finally {
    @unlink($cookieFile);
  }
}

/** Load the City Builder reference document from a private local JSON file. */
function loadCityTemplate(): array
{
  $configured = trim((string)(getenv('FOE_CITY_TEMPLATE_FILE') ?: ''));
  $file = $configured !== ''
    ? $configured
    : dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'foe-city-template.json';

  if (!is_file($file) || !is_readable($file)) {
    importError('TEMPLATE_NOT_FOUND', 'CONFIGURATION');
  }

  try {
    $template = json_decode((string)file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
  } catch (JsonException $e) {
    throw new ImportApiException('TEMPLATE_INVALID', 'CONFIGURATION', false, [], 500, $e);
  }
  if (!is_array($template) || array_is_list($template)) {
    importError('TEMPLATE_INVALID', 'CONFIGURATION');
  }
  foreach (['townhallSet', 'buildings', 'buildingSets', 'impedimentSet', 'expansions'] as $key) {
    if (!array_key_exists($key, $template) || !is_array($template[$key])) {
      importError('TEMPLATE_INVALID', 'CONFIGURATION', 500, false, ['field' => $key]);
    }
  }
  return $template;
}

function runImport(array $input): array
{
  $username = trim((string)($input['username'] ?? ''));
  $password = (string)($input['password'] ?? '');
  $world = trim((string)($input['world'] ?? ''));
  if ($username === '' || $password === '' || $world === '') importError('REQUIRED_FIELDS_MISSING', 'INPUT', 400);
  if (strlen($username) > 200 || strlen($password) > 1000 || strlen($world) > 100) importError('INPUT_TOO_LONG', 'INPUT', 400);
  $auth = loadAuth();
  if (!$auth || ($auth['email'] ?? '') !== 'foe-manager@zreptil.de') importError('FIREBASE_ACCOUNT_NOT_CONFIGURED', 'CONFIGURATION');
  $auth = refreshAuth($auth);
  $dir = sys_get_temp_dir() . '/foe_import_' . bin2hex(random_bytes(12));
  if (!mkdir($dir, 0700)) importError('TEMP_DIRECTORY_UNAVAILABLE', 'SERVER');
  try {
    $result = exportCity($username, $password, $world, $dir);
    $meta = $result['metadata']['buildings'] ?? [];
    if (!isset($meta['W_MultiAge_ONBOARD25A1'])) $meta['W_MultiAge_ONBOARD25A1'] = ['name' => 'Lagerfeuer', 'width' => 2, 'length' => 2, 'roadRequired' => false];
    $reference = loadCityTemplate();
    // Stable identity until a verified FoE player ID is available in the export.
    // Do not put the username into the Firestore document name.
    $identity = strtolower(trim($username));

    // The City Builder uses the visible name as the Firestore document ID.
    // Normalize spaces/punctuation consistently, independent of user input.
    $safeWorldName = preg_replace('/[^\p{L}\p{N}_-]+/u', '_', $result['worldName']);
    $safeWorldName = trim((string)$safeWorldName, '_');
    if ($safeWorldName === '') importError('FOE_WORLD_NOT_FOUND', 'FOE', 502);
    $name = 'FoE-' . $safeWorldName . '-' . preg_replace('/[^A-Za-z0-9_-]/', '_', $identity);
    $existing = null;
    try {
      $existing = api(firestoreUrl($auth['uid'], $name), null, $auth['idToken']);
    } catch (ImportApiException $e) {
      // Only a missing document is expected on the first import.
      if ($e->apiCode !== 'FIREBASE_DOCUMENT_NOT_FOUND') throw $e;
    }
    $displayName = $name;
    $converted = convertCity($result['export'], $meta, $reference, $displayName);
    $importKeys = ['townhallSet', 'buildings', 'buildingSets', 'impedimentSet', 'expansions', 'cityResult'];
    $doc = 'projects/' . PROJECT_ID . '/databases/(default)/documents/users/' . $auth['uid'] . '/cities/' . $name;
    if ($existing === null) {
      // Convert the local JSON reference to Firestore Values, then replace FoE-owned fields.
      $fields = [];
      foreach ($reference as $key => $value) $fields[$key] = fv($value);
      $fields['name'] = fv($displayName);
      foreach ($importKeys as $key) $fields[$key] = fv($converted[$key]);
      $write = ['update' => ['name' => $doc, 'fields' => $fields], 'currentDocument' => ['exists' => false]];
    } else {
      // Update only FoE-owned fields, preserve all user-defined settings.
      // updateTime precondition prevents silently overwriting concurrent edits.
      $fields = [];
      foreach ($importKeys as $key) $fields[$key] = fv($converted[$key]);
      $write = ['update' => ['name' => $doc, 'fields' => $fields],
        'updateMask' => ['fieldPaths' => $importKeys],
        'currentDocument' => ['updateTime' => $existing['updateTime']]];
    }
    $commit = api('https://firestore.googleapis.com/v1/projects/' . PROJECT_ID . '/databases/(default)/documents:commit',
      ['writes' => [$write]], $auth['idToken']);
    return ['success' => true, 'name' => $displayName, 'documentId' => $name,
      'action' => $existing === null ? 'created' : 'updated', 'world' => $result['world'],
      'worldName' => $result['worldName'],
      'buildings' => count($converted['buildings']),
      'roads' => count($converted['cityResult']['roadPositions']),
      'expansions' => count(array_filter($converted['expansions'])),
      'writeTime' => $commit['writeResults'][0]['updateTime'] ?? null,
      'cityBuilderUrl' => 'https://foe-city-builder.web.app/'];
  } finally {
    foreach (glob($dir . '/*') ?: [] as $path) if (is_file($path)) @unlink($path);
    @rmdir($dir);
  }
}

/** Public endpoint guards. Rate limiting is best-effort and is not an authentication mechanism. */
function isLocalDevelopment(): bool
{
  // Der integrierte PHP-Server wird durch start-php.ps1 ausschliesslich
  // an 127.0.0.1 gebunden. SERVER_ADDR ist dabei nicht immer gesetzt;
  // HTTP_HOST kann durch den Angular-Proxy veraendert werden.
  return PHP_SAPI === 'cli-server'
    && in_array((string)($_SERVER['REMOTE_ADDR'] ?? ''), ['127.0.0.1', '::1'], true)
    && (string)($_SERVER['SERVER_PORT'] ?? '') === '8000';
}

function requireHttps(): void
{
  if (isLocalDevelopment()) return;
  $https = strtolower((string)($_SERVER['HTTPS'] ?? ''));
  if ($https !== 'on' && $https !== '1') {
    http_response_code(403);
    importError('HTTPS_REQUIRED', 'SECURITY', 403);
  }
}

function enforceRateLimit(): void
{
  $folder = getenv('FOE_RATE_LIMIT_DIR');
  if (!is_string($folder) || $folder === '' || !is_dir($folder)) {
    importError('RATE_LIMIT_CONFIG_MISSING', 'CONFIGURATION');
  }
  $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
  // Do not trust X-Forwarded-For from untrusted clients.
  $key = hash('sha256', $ip);
  $file = rtrim($folder, '\\/') . DIRECTORY_SEPARATOR . $key . '.json';
  $fh = fopen($file, 'c+');
  if (!$fh) importError('RATE_LIMIT_STORAGE_ERROR', 'SERVER');
  try {
    if (!flock($fh, LOCK_EX)) importError('RATE_LIMIT_LOCK_FAILED', 'SERVER');
    $old = stream_get_contents($fh);
    $state = json_decode($old ?: '{}', true);
    if (!is_array($state)) $state = [];
    $now = time();
    $window = (int)($state['window'] ?? 0);
    $count = (int)($state['count'] ?? 0);
    if ($window <= $now - 36 || $window > $now) { // 3600
      $window = $now;
      $count = 0;
    }
    if ($count >= 6) {
      http_response_code(429);
      header('Retry-After: ' . max(1, 3600 - ($now - $window)));
      importError('RATE_LIMIT_EXCEEDED', 'RATE_LIMIT', 429, true);
    }
    rewind($fh);
    ftruncate($fh, 0);
    fwrite($fh, json_encode(['window' => $window, 'count' => $count + 1], JSON_THROW_ON_ERROR));
    fflush($fh);
  } finally {
    flock($fh, LOCK_UN);
    fclose($fh);
  }
}

function acquireImportSlot(): mixed
{
  $folder = getenv('FOE_RATE_LIMIT_DIR');
  $path = rtrim((string)$folder, '\\/') . DIRECTORY_SEPARATOR . 'global-import.lock';
  $fh = fopen($path, 'c+');
  if (!$fh) importError('IMPORT_LOCK_STORAGE_ERROR', 'SERVER');
  if (!flock($fh, LOCK_EX | LOCK_NB)) {
    fclose($fh);
    http_response_code(429);
    importError('IMPORT_ALREADY_RUNNING', 'RATE_LIMIT', 429, true);
  }
  return $fh;
}

try {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    importError('METHOD_NOT_ALLOWED', 'REQUEST', 405);
  }
  requireHttps();
  // Anonymous endpoint: no API secret is sent to the browser.
  // Origin validation reduces browser-based cross-site requests, but is not authentication.
  $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
  $host = (string)($_SERVER['HTTP_HOST'] ?? '');
  $allowedOrigin = false;
  if ($origin !== '') {
    if (isLocalDevelopment()) {
      $allowedOrigin = $origin === 'https://localhost:67';
    } else {
      $allowedOrigin = parse_url($origin, PHP_URL_SCHEME) === 'https'
        && strcasecmp((string)parse_url($origin, PHP_URL_HOST),
          (string)preg_replace('/:[0-9]+$/', '', $host)) === 0;
    }
  }
  if ($origin !== '' && !$allowedOrigin) {
    http_response_code(403);
    importError('ORIGIN_NOT_ALLOWED', 'SECURITY', 403);
  }
  enforceRateLimit();
  $slot = acquireImportSlot();
  try {
    $body = file_get_contents('php://input');
    if ($body === false || strlen($body) > 8192) {
      http_response_code(413);
      importError('REQUEST_TOO_LARGE', 'REQUEST', 413);
    }
    $input = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($input)) importError('INVALID_JSON_BODY', 'REQUEST', 400);
    echo json_encode(runImport($input), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
  } finally {
    flock($slot, LOCK_UN);
    fclose($slot);
  }
} catch (Throwable $error) {
  $public = publicImportError($error);
  $status = $error instanceof ImportApiException ? $error->httpStatus
    : ($error instanceof JsonException || $error instanceof InvalidArgumentException ? 400 : 500);
  http_response_code($status);
  error_log(sprintf(
    'FoE import failed [%s]: %s: %s in %s:%d',
    $public['code'],
    get_class($error),
    preg_replace('/[\r\n]+/', ' ', substr($error->getMessage(), 0, 300)),
    basename($error->getFile()),
    $error->getLine()
  ));
  echo json_encode(['success' => false, 'error' => $public],
    JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
}
