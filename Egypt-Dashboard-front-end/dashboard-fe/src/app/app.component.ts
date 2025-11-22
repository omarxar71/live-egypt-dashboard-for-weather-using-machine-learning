import { Component } from '@angular/core';
import { MapComponent } from "./components/map/map.component";
import { ChartsComponent } from './components/charts/charts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ MapComponent , ChartsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dashboard-fe';
}
