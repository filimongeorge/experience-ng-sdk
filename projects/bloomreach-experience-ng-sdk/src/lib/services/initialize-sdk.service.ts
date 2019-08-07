/*
 * Copyright 2019 Hippo B.V. (http://www.onehippo.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RequestContextService } from './request-context.service';
import { PageModelService } from './page-model.service';
import { _initializeCmsIntegration } from '../common-sdk/utils/initialize-cms-integration';
import { logCmsCreateOverlay } from '../common-sdk/utils/page-model';
import { Observable, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InitializeSdkService {
  constructor(
    private pageModelService: PageModelService,
    private requestContextService: RequestContextService,
    private router: Router
  ) {
    this.onCmsInitialization = this.onCmsInitialization.bind(this);
    this.onComponentUpdate = this.onComponentUpdate.bind(this);
  }

  initialize({initializePageModel = true, initializeRouterEvents = true} = {}) {
    this.initializeCmsIntegration();

    if (initializePageModel) {
      this.fetchPageModel();
    }

    if (initializeRouterEvents) {
      return this.initializeRouterEvents();
    }

    return;
  }

  protected initializeCmsIntegration() {
    _initializeCmsIntegration(this.onCmsInitialization, this.onComponentUpdate);
  }

  protected initializeRouterEvents() {
    return this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.requestContextService.parseUrlPath(event.url);
        this.fetchPageModel();
      }
    });
  }

  protected fetchPageModel() {
    const pageModel$ = this.pageModelService.fetchPageModel();
    pageModel$.subscribe();

    return pageModel$;
  }

  private onCmsInitialization(cms: any) {
    const debugging = this.requestContextService.getDebugging();
    this.pageModelService.setChannelManagerApi(cms);
    if (this.pageModelService.getPageModel()) {
      cms.createOverlay();
      logCmsCreateOverlay(debugging);
    }
  }

  private onComponentUpdate(id: string, propertiesMap) {
    this.pageModelService.updateComponent(id, propertiesMap).subscribe();
  }
}
