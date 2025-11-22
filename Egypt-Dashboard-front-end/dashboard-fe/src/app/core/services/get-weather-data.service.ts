import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetWeatherDataService {

  constructor(private readonly socket:Socket){}
  getAqiDetails():Observable<any>{
    return this.socket.fromEvent("new-data")
  }
}
