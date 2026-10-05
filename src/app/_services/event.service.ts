import {Injectable} from '@angular/core';
import {HttpClient, HttpRequest} from '@angular/common/http';
import {EventData} from '@/_model/event-data';
import {GLOBALS} from '@/_services/globals.service';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  eventList: EventData[];
  loadDone = false;
  fullyLoaded = false;

  constructor(public http: HttpClient) {
  }

  loadFromAsset(onDone?: (data: any) => void) {
    let req = new HttpRequest(
      'GET',
      `assets/event-data.json?v=${GLOBALS.version}`,
      null,
      {responseType: 'json'});
    let body: any;
    this.loadDone = false;
    this.fullyLoaded = false;
    this.http.request(req).subscribe({
      next: (data: any) => {
        body = data;
      }, error: (err) => {
        this.fullyLoaded = true;
        console.error(err);
      }, complete: () => {
        this.eventList = body.body;
        this.fullyLoaded = true;
        this.loadDone = true;
        // this.convertTasksFromLinnunFoe();
        onDone?.(this.eventList);
      }
    });
  }

  /**
   * Converts and organizes task data from a predefined source format,
   * specifically from the "LinnunFoe" system, into a structured format.
   * The method processes an array of tasks, associates them with specific
   * towns, and creates a mapping of task sequences and their respective indices.
   *
   * Will be called when needed to update the datastructures. Currently not used.
   *
   * @return {void} This method does not return any value.
   * It logs the processed task data structure to the console.
   */
  convertTasksFromLinnunFoe() {
    const src = [1,
      'Beliebiger Aufseher',
      'Gewürzladen 25',
      '50K Festvorräte sammeln',
      'Bankett-Aufseher 1 ODER Kutschen-Aufseher 1',
      'Saftbar 1',
      'Bankettsaal-Aufseher 3',
      '50 Gebäude verbessern',
      '1M Festvorräte sammeln',
      'Bauernhof 1',
      'Saftbar 50',
      'Bauernhof-Aufseher 1',
      '250M transportieren',
      'Gewürzladen 100',
      'Saft-Aufseher 2',
      '50 Gebäude verbessern',
      '1B Güter herstellen',
      'Backstube 1',
      'Backstube-Aufseher 2',
      'Bauernhof 50',
      '50 Gebäude verbessern',
      'Gewürz-Aufseher 3',
      'Bauernhof-Aufseher 3',
      'Saftbar 100',
      '50B Festvorräte sammeln',
      'Kutschen-Aufseher 4',
      '100 Gebäude verbessern',
      '1T transportieren',
      'Gourmet-Aufseher 2',
      '150 Gebäude verbessern',
      'Bauernhof 100',
      '4T Güter herstellen',
      '10B Saft herstellen',
      'Backstube 50',
      '200 Gebäude verbessern',
      'Gewürzladen 200',
      '16Q Festvorräte sammeln',
      '250 Gebäude verbessern',
      'Gourmet-Metzgerei 75',
      2,
      'Bankettsaal 10',
      'Kutschen-Aufseher 1',
      'Kutschen-Aufseher 3',
      '60K Gewürze herstellen',
      'Saftbar 1',
      '50 Gebäude verbessern',
      'Saft-Aufseher 2',
      '15M transportieren',
      'Bauernhof 1',
      'Bauernhof 25',
      'Bankettsaal-Aufseher 3',
      '100 Gebäude verbessern',
      '99B Festvorräte sammeln',
      'Gewürzladen 100',
      'Backstube-Aufseher 2',
      '100 Gebäude verbessern',
      '5T Backwaren herstellen',
      'Bauernhof-Aufseher 3',
      'Backstube 25',
      'Saftbar 100',
      '16T Festvorräte sammeln',
      'Gourmet-Metzgerei 1',
      'Saft-Aufseher 3',
      '150 Gebäude verbessern',
      'Gewürzladen 200',
      '32T transportieren',
      'Gourmet-Aufseher 2',
      'Bauernhof 100',
      '15T Bauernhof herstellen',
      'Gourmet-Metzgerei 50',
      '150 Gebäude verbessern',
      '50B Saft herstellen',
      'Saftbar 200',
      'Kutschendepot 300',
      'Kutschen-Aufseher 4',
      '18Q Festvorräte sammeln',
      '200B Gewürze herstellen',
      '200 Gebäude verbessern',
      3,
      'Gewürz-Aufseher 1',
      'Kutschendepot 10',
      '50K Gewürze herstellen',
      'Saft-Aufseher 1',
      '3M transportieren',
      '50 Gebäude verbessern',
      'Saftbar 25',
      'Bankettsaal-Aufseher 2',
      'Bauernhof 1',
      'Saft-Aufseher 2',
      '50 Gebäude verbessern',
      '1B Festvorräte sammeln',
      'Kutschen-Aufseher 3',
      'Bauernhof 25',
      'Bauernhof-Aufseher 2',
      '25B Bauernhof herstellen',
      'Gewürzladen 100',
      '100 Gebäude verbessern',
      'Backstube 1',
      'Backstube-Aufseher 3',
      'Backstube 25',
      '3B Saft herstellen',
      'Bankettsaal-Aufseher 4',
      '100 Gebäude verbessern',
      'Gourmet-Metzgerei 1',
      '30T transportieren',
      'Saftbar 150',
      'Gourmet-Aufseher 2',
      'Backstube 50',
      '150 Gebäude verbessern',
      '10Q Gourmet-Fleisch herstellen',
      'Bauernhof 100',
      'Gourmet-Metzgerei 50',
      'Gewürzladen 200',
      '200 Gebäude verbessern',
      '12Q Festvorräte sammeln',
      'Backstube 100',
      '10Q Backwaren herstellen'];
    const tasks: any = {};
    const towns: any[] = [];
    let town = 0;
    for (const s of src) {
      if (typeof s === 'number') {
        town = s;
        if (towns.length < s) {
          towns.push({seq: []});
        }
        continue;
      }
      towns[town - 1].seq.push(s);
      tasks[s] = [[], [], []];
    }
    let idx = 0;
    for (const key of Object.keys(tasks)) {
      for (let i = 0; i < towns.length; i++) {
        for (let j = 0; j < towns[i].seq.length; j++) {
          if (towns[i].seq[j] === key) {
            tasks[key][i].push(j);
          }
        }
      }
      idx++;
    }
    console.log('the tasks as defined by LinnunFoe');
    console.log(JSON.stringify(tasks).replace(/,"/g, ',\n"'));
  }
}
