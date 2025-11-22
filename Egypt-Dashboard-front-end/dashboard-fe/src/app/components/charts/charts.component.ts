import { Component } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators'; // Import the 'take' operator
import { GetWeatherDataService } from '../../core/services/get-weather-data.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css'
})
export class ChartsComponent implements OnInit {
  dataSubscription :any 
private pollutantNames:any= {
  co: 'Carbon Monoxide',
  no: 'Nitrogen Monoxide',
  no2: 'Nitrogen Dioxide',
  o3: 'Ozone',
  so2: 'Sulphur Dioxide',
  pm2_5: 'Fine Particles (PM2.5)',
  pm10: 'Coarse Particles (PM10)',
  nh3: 'Ammonia'
}
public barChartData: ChartConfiguration<'bar'>['data'] = {
  labels: ['Loading data...'],
  datasets: [
    { 
      data: [], 
      label: 'Concentration (μg/m³)',
      backgroundColor: '#0d6efd',
      borderColor: '#0d6efd',
      borderRadius: 4
    }
  ]
};

public barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y', // This makes it a horizontal bar chart
  scales: {
    x: { 
      ticks: { color: '#adb5bd' },
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
      title: {
        display: true,
        text: 'Concentration (μg/m³)',
        color: '#adb5bd'
      }
    },
    y: { 
      ticks: { color: '#adb5bd', font: { size: 14 } },
      grid: { display: false }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#000',
      titleFont: { size: 14 },
      bodyFont: { size: 12 },
    }
  }
};

constructor(private readonly GetWeatherDataService:GetWeatherDataService){}
ngOnInit(): void {
    this.dataSubscription = this.GetWeatherDataService.getAqiDetails().pipe(take(1)).subscribe({
      next:(data)=>{
        this.updateChart(data.components)
      },
      error:(err)=>{
        console.log(err)
      }
    })
}


updateChart(components: any): void {
  const labels: string[] = [];
  const data: number[] = [];

  for (const [key, value] of Object.entries(components)) {
    labels.push(this.pollutantNames[key] || key);
    data.push(value as number);
  }

  this.barChartData.datasets[0].data = data;
  this.barChartData.labels = labels;
}
}

