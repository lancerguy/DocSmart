import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { first, Subscription } from 'rxjs'
import { PaperlessDocument } from 'src/app/data/paperless-document'
import { PaperlessSavedView } from 'src/app/data/paperless-saved-view'
import { ConsumerStatusService } from 'src/app/services/consumer-status.service'
import { DocumentService } from 'src/app/services/rest/document.service'
import { PaperlessTag } from 'src/app/data/paperless-tag'
import { FILTER_HAS_TAGS_ALL } from 'src/app/data/filter-rule-type'
import { QueryParamsService } from 'src/app/services/query-params.service'
import { OpenDocumentsService } from 'src/app/services/open-documents.service'

@Component({
  selector: 'app-saved-view-widget',
  templateUrl: './saved-view-widget.component.html',
  styleUrls: ['./saved-view-widget.component.scss'],
})
export class SavedViewWidgetComponent implements OnInit, OnDestroy {
  loading: boolean = true

  constructor(
    private documentService: DocumentService,
    private router: Router,
    private queryParamsService: QueryParamsService,
    private consumerStatusService: ConsumerStatusService,
    private openDocumentsService: OpenDocumentsService
  ) {}

  @Input()
  savedView: PaperlessSavedView

  documents: PaperlessDocument[] = []

  subscription: Subscription

  ngOnInit(): void {
    this.reload()
    this.subscription = this.consumerStatusService
      .onDocumentConsumptionFinished()
      .subscribe((status) => {
        this.reload()
      })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  reload() {
    this.loading = true
    this.documentService
      .listFiltered(
        1,
        10,
        this.savedView.sort_field,
        this.savedView.sort_reverse,
        this.savedView.filter_rules
      )
      .subscribe((result) => {
        this.loading = false
        this.documents = result.results
      })
  }

  showAll() {
    if (this.savedView.show_in_sidebar) {
      this.router.navigate(['view', this.savedView.id])
    } else {
      this.router.navigate(['documents'], {
        queryParams: { view: this.savedView.id },
      })
    }
  }

  clickDoc(doc: PaperlessDocument) {
    this.openDocumentsService
      .openDocument(doc)
      .pipe(first())
      .subscribe((open) => {
        if (open) this.router.navigate(['documents', doc.id])
      })
  }

  clickTag(tag: PaperlessTag) {
    this.queryParamsService.navigateWithFilterRules([
      { rule_type: FILTER_HAS_TAGS_ALL, value: tag.id.toString() },
    ])
  }
}
