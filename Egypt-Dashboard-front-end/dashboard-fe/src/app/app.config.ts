import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
const config: SocketIoConfig = { url:"http://localhost:5001", options: {} };
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
    importProvidersFrom(SocketIoModule.forRoot(config)),
    provideCharts(withDefaultRegisterables())
    

  ],
};
