import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen'
import { ThemeService } from './services/theme.service';
import { LayoutService } from './services/layout.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(private themeService: ThemeService, private layoutService: LayoutService) {
    this.themeService.init();
    this.layoutService.init();
    this.initializeApp();
  }

  initializeApp() {
    /* To make sure we provide the fastest app loading experience
       for our users, hide the splash screen automatically
       when the app is ready to be used:

        https://capacitor.ionicframework.com/docs/apis/splash-screen#hiding-the-splash-screen
    */
    SplashScreen.hide();
  }
}
