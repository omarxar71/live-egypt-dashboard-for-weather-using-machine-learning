import { Component, inject } from '@angular/core';
import * as L from 'leaflet'; // Import Leaflet
import { GetWeatherDataService } from '../../core/services/get-weather-data.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent {
  private readonly _GetWeatherDataService=inject(GetWeatherDataService)
  private map!:L.Map
  ngAfterViewInit(){
    this.initMap()
    this.listenForAqi()
  }
  private initMap (){
    this.map=L.map("map").setView([30.0444,31.2357],12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);
  }

  // we should listen for aqi and send the response to this function {addAqiToMap()}
  listenForAqi(){
    console.log('Starting AQI listener...'); // 👈 Add this line

    this._GetWeatherDataService.getAqiDetails().subscribe({
      next:(data)=>{
        console.log("data")
        console.log(data); // 👈 Also log the data
        this.addAqiToMap(data)
      } , 
      error:(err)=>{
        console.log(err)
      }
    })
  }



  // // {
  // //   "_id": "some_id",
  // //   "aqi": 3,  // <-- The AQI value
  // //   "components": { ... },
  // //   "timestamp": "...",
  // //   "location": {
  // //     "_id": "some_other_id",
  // //     "name": "Downtown Cairo",
  // //     "location": {
  // //       "type": "Point",
  // //       "coordinates": [ 31.2357, 30.0444 ] // <-- The coordinates array
  // //                        //  [0]      [1]
  // //     }
  // //   }
  // // } this is the response from the weather service (getAqiDetails)

  addAqiToMap(data:any){
   const lon = data.location.location.coordinates[0]
   const lat = data.location.location.coordinates[1]
   const aqi = data.aqi
   const color = this.colorDotsInMap(aqi)
   const circle = L.circleMarker([lat, lon], {
    radius: 12,
    fillColor: color,
    fillOpacity: 0.7,
    color: 'green', // Border color
    weight: 2,      // Border width
  }).addTo(this.map);
  // 👇 Add this line to make the dots clickable
circle.bindPopup(`<b>${data.location.name}</b><br> Air Quality Index (AQI): <b>${aqi}</b>`);
  }
  colorDotsInMap(aqi:any){
    if (aqi <= 1) return '#4CAF50'; // Green for Good (AQI 1)
    if (aqi <= 2) return '#FFC107'; // Yellow for Moderate (AQI 2)
    if (aqi <= 3) return '#FFA500'; // Orange for Unhealthy for Sensitive Groups (AQI 3)
    if (aqi <= 4) return '#FF8C00'; // Red for Unhealthy (AQI 4)
    if (aqi <=5) return "#F44336"
    return '#9C27B0'; // Purple for Very Unhealthy/Hazardous (AQI 5)
  }

}
