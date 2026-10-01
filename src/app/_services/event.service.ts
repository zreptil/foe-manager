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
        onDone?.(this.eventList);
      }
    });
  }
}
