# Workflow API Specifications (Draft)

The following OpenAPI fragments describe the core endpoints required for end-to-end order processing.

## Quote Service

```yaml
paths:
  /quotes/{quoteId}/convert:
    post:
      summary: Convert an approved quote into a project
      tags: [Quotes]
      security:
        - bearerAuth: [quotes:convert]
      parameters:
        - name: quoteId
          in: path
          required: true
          schema:
            type: string
        - name: dryRun
          in: query
          required: false
          schema:
            type: boolean
            default: false
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              properties:
                requestedStartDate:
                  type: string
                  format: date
                templateId:
                  type: string
                options:
                  type: object
                  properties:
                    includeRiskAssessment:
                      type: boolean
                      default: true
                    autoAssignTeam:
                      type: boolean
                      default: true
      responses:
        '202':
          description: Conversion accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QuoteConversionJob'
        '409':
          description: Quote is not in an approvable state
```

## Project Service

```yaml
paths:
  /projects:
    post:
      summary: Create a project from a quote conversion event
      tags: [Projects]
      security:
        - serviceToken: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProjectCreateRequest'
      responses:
        '201':
          description: Project created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'
  /projects/{projectId}/delivery-notes:
    post:
      summary: Issue a delivery note for a project
      tags: [Delivery Notes]
      security:
        - bearerAuth: [delivery:write]
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DeliveryNoteCreateRequest'
      responses:
        '201':
          description: Delivery note created
          headers:
            Location:
              schema:
                type: string
              description: URI of the created delivery note
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DeliveryNote'
```

## Delivery Note Service

```yaml
paths:
  /delivery-notes/{deliveryNoteId}/status:
    post:
      summary: Update delivery note status (draft, sent, delivered, cancelled)
      tags: [Delivery Notes]
      security:
        - bearerAuth: [delivery:write]
      parameters:
        - name: deliveryNoteId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [draft, sent, delivered, cancelled]
                signedAt:
                  type: string
                  format: date-time
                signatureId:
                  type: string
      responses:
        '200':
          description: Delivery note status updated
```

## Invoice Service

```yaml
paths:
  /projects/{projectId}/invoice-suggestions:
    get:
      summary: Retrieve draft invoice suggestions for a project
      tags: [Invoices]
      security:
        - bearerAuth: [invoices:read]
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Invoice suggestions
          content:
            application/json:
              schema:
                type: object
                properties:
                  deliveryNotes:
                    type: array
                    items:
                      $ref: '#/components/schemas/DeliveryNoteSummary'
                  milestones:
                    type: array
                    items:
                      $ref: '#/components/schemas/MilestoneInvoiceSuggestion'
  /projects/{projectId}/invoices:
    post:
      summary: Issue an invoice for a project
      tags: [Invoices]
      security:
        - bearerAuth: [invoices:write]
      parameters:
        - name: projectId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/InvoiceCreateRequest'
      responses:
        '201':
          description: Invoice created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Invoice'
```

## Shared Schemas

```yaml
components:
  schemas:
    QuoteConversionJob:
      type: object
      properties:
        jobId:
          type: string
        status:
          type: string
          enum: [queued, running, completed, failed]
        projectId:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
    ProjectCreateRequest:
      type: object
      required: [quoteId, customerId, name, budget, phases]
      properties:
        quoteId:
          type: string
        customerId:
          type: string
        name:
          type: string
        budget:
          type: number
        startDate:
          type: string
          format: date
        endDate:
          type: string
          format: date
        phases:
          type: array
          items:
            $ref: '#/components/schemas/ProjectPhase'
        milestones:
          type: array
          items:
            $ref: '#/components/schemas/ProjectMilestone'
    DeliveryNoteCreateRequest:
      type: object
      required: [date, customerId, items]
      properties:
        date:
          type: string
          format: date
        customerId:
          type: string
        deliveryAddress:
          type: string
        items:
          type: array
          items:
            $ref: '#/components/schemas/DeliveryNoteItemInput'
    InvoiceCreateRequest:
      type: object
      required: [date, dueDate, customerId, lineItems]
      properties:
        date:
          type: string
          format: date
        dueDate:
          type: string
          format: date
        customerId:
          type: string
        projectId:
          type: string
        deliveryNoteIds:
          type: array
          items:
            type: string
        lineItems:
          type: array
          items:
            $ref: '#/components/schemas/InvoiceLineItem'
```

These fragments will be merged into full OpenAPI documents when the backend stack is scaffolded.
