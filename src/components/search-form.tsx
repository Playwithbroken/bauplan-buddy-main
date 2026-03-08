import * as React from "react"
import { Search, FileText, Users, FolderOpen, Receipt, Calendar, X, Truck, CheckCircle, Building } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Label } from '@/components/ui/label'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import AppStorageService from '@/services/appStorageService'

type SearchFormProps = React.ComponentProps<"form"> & {
  placeholder?: string
  label?: string
  inputId?: string
}

type SearchResult = {
  id: string
  title: string
  description: string
  url: string
  category: 'page' | 'project' | 'invoice' | 'customer' | 'supplier' | 'delivery-note' | 'order-confirmation'
  icon: React.ElementType
  badge?: string
}

const searchablePages: SearchResult[] = [
  { id: 'p1', title: 'Dashboard', description: 'Übersicht und Statistiken', url: '/dashboard', category: 'page', icon: FolderOpen },
  { id: 'p2', title: 'Projekte', description: 'Bauprojekte verwalten', url: '/projects', category: 'page', icon: FolderOpen },
  { id: 'p3', title: 'Angebote', description: 'Angebote erstellen und verwalten', url: '/quotes', category: 'page', icon: FileText },
  { id: 'p4', title: 'Rechnungen', description: 'Rechnungen verwalten', url: '/invoices', category: 'page', icon: Receipt },
  { id: 'p5', title: 'Lieferscheine', description: 'Lieferscheine verwalten', url: '/delivery-notes', category: 'page', icon: Truck },
  { id: 'p6', title: 'Auftragsbestätigungen', description: 'Auftragsbestätigungen verwalten', url: '/order-confirmations', category: 'page', icon: CheckCircle },
  { id: 'p7', title: 'Kunden', description: 'Kundenverwaltung', url: '/customers', category: 'page', icon: Users },
  { id: 'p8', title: 'Lieferanten', description: 'Lieferantenverwaltung', url: '/suppliers', category: 'page', icon: Building },
  { id: 'p9', title: 'Team', description: 'Team & Ressourcen Management', url: '/teams', category: 'page', icon: Users },
  { id: 'p10', title: 'Kalender', description: 'Terminplanung', url: '/calendar', category: 'page', icon: Calendar },
  { id: 'p11', title: 'Dokumente', description: 'Dokumentenverwaltung', url: '/documents', category: 'page', icon: FileText },
  { id: 'p12', title: 'Analytics', description: 'Analysen und Reports', url: '/analytics', category: 'page', icon: FileText },
  { id: 'p13', title: 'Einstellungen', description: 'App-Einstellungen', url: '/settings', category: 'page', icon: FileText },
]

const getCategoryBadge = (category: SearchResult['category']): string => {
  const badges: Record<SearchResult['category'], string> = {
    'page': 'Seite',
    'project': 'Projekt',
    'invoice': 'Rechnung',
    'customer': 'Kunde',
    'supplier': 'Lieferant',
    'delivery-note': 'Lieferschein',
    'order-confirmation': 'Auftragsbestätigung',
  }
  return badges[category]
}

export function SearchForm({
  placeholder = "Suchen...",
  label = "Suche",
  inputId,
  className,
  ...props
}: SearchFormProps) {
  const generatedId = React.useId()
  const resolvedId = inputId ?? generatedId
  const navigate = useNavigate()
  const [query, setQuery] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const searchData = React.useCallback((query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase().trim()
    if (!lowerQuery) return []

    const results: SearchResult[] = []
    const storage = AppStorageService.getInstance()
    const state = storage.getState()

    // Search projects
    state.projects?.forEach(project => {
      if (
        project.name?.toLowerCase().includes(lowerQuery) ||
        project.projectNumber?.toLowerCase().includes(lowerQuery) ||
        project.customer?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: `project-${project.id}`,
          title: project.name || 'Unbenanntes Projekt',
          description: `Projekt ${project.projectNumber || ''} - ${project.customer || ''}`,
          url: `/projects?id=${project.id}`,
          category: 'project',
          icon: FolderOpen,
          badge: project.status || 'Aktiv'
        })
      }
    })

    // Search invoices
    state.invoices?.forEach(invoice => {
      if (
        invoice.invoiceNumber?.toLowerCase().includes(lowerQuery) ||
        invoice.customerName?.toLowerCase().includes(lowerQuery) ||
        invoice.projectName?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: `invoice-${invoice.id}`,
          title: `Rechnung ${invoice.invoiceNumber || ''}`,
          description: `${invoice.customerName || ''} - ${invoice.totalAmount ? invoice.totalAmount.toFixed(2) + ' EUR' : ''}`,
          url: `/invoices?id=${invoice.id}`,
          category: 'invoice',
          icon: Receipt,
          badge: invoice.status || 'Offen'
        })
      }
    })

    // Search delivery notes
    state.deliveryNotes?.forEach(note => {
      if (
        note.deliveryNoteNumber?.toLowerCase().includes(lowerQuery) ||
        note.customerName?.toLowerCase().includes(lowerQuery) ||
        note.projectName?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: `delivery-${note.id}`,
          title: `Lieferschein ${note.deliveryNoteNumber || ''}`,
          description: `${note.customerName || ''} - ${note.deliveryDate || ''}`,
          url: `/delivery-notes?id=${note.id}`,
          category: 'delivery-note',
          icon: Truck,
          badge: note.status || 'Offen'
        })
      }
    })

    // Search order confirmations
    state.orderConfirmations?.forEach(order => {
      if (
        order.orderNumber?.toLowerCase().includes(lowerQuery) ||
        order.customerName?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: `order-${order.id}`,
          title: `Auftragsbestätigung ${order.orderNumber || ''}`,
          description: `${order.customerName || ''} - ${order.orderDate || ''}`,
          url: `/order-confirmations?id=${order.id}`,
          category: 'order-confirmation',
          icon: CheckCircle,
          badge: order.status || 'Offen'
        })
      }
    })

    // Search customers
    state.customers?.forEach(customer => {
      if (
        customer.name?.toLowerCase().includes(lowerQuery) ||
        customer.customerNumber?.toLowerCase().includes(lowerQuery) ||
        customer.email?.toLowerCase().includes(lowerQuery) ||
        customer.phone?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: `customer-${customer.id}`,
          title: customer.name || 'Unbenannter Kunde',
          description: `Kunden-Nr. ${customer.customerNumber || ''} - ${customer.email || customer.phone || ''}`,
          url: `/customers?id=${customer.id}`,
          category: 'customer',
          icon: Users,
          badge: customer.type || 'Standard'
        })
      }
    })

    // Search suppliers
    state.suppliers?.forEach(supplier => {
      if (
        supplier.name?.toLowerCase().includes(lowerQuery) ||
        supplier.supplierNumber?.toLowerCase().includes(lowerQuery) ||
        supplier.email?.toLowerCase().includes(lowerQuery) ||
        supplier.phone?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: `supplier-${supplier.id}`,
          title: supplier.name || 'Unbenannter Lieferant',
          description: `Lieferanten-Nr. ${supplier.supplierNumber || ''} - ${supplier.email || supplier.phone || ''}`,
          url: `/suppliers?id=${supplier.id}`,
          category: 'supplier',
          icon: Building,
          badge: supplier.category || 'Standard'
        })
      }
    })

    // Search pages if no data matches or query is very short
    if (results.length < 5 || lowerQuery.length <= 3) {
      searchablePages.forEach(page => {
        if (
          page.title.toLowerCase().includes(lowerQuery) ||
          page.description.toLowerCase().includes(lowerQuery)
        ) {
          results.push(page)
        }
      })
    }

    // Remove duplicates and limit to 12 results
    const uniqueResults = Array.from(new Map(results.map(r => [r.id, r])).values())
    return uniqueResults.slice(0, 12)
  }, [])

  const filteredResults = React.useMemo(() => {
    return searchData(query)
  }, [query, searchData])

  const handleSelect = (result: SearchResult) => {
    navigate(result.url)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredResults.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form className={cn("relative", className)} {...props} onSubmit={(e) => e.preventDefault()}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor={resolvedId} className="sr-only">
            {label}
          </Label>
          <SidebarInput
            ref={inputRef}
            id={resolvedId}
            placeholder={placeholder}
            className="pl-8 pr-8"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => query && setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setIsOpen(false)
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="size-4" />
            </button>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Dropdown with search results */}
      {isOpen && query && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 mx-4 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[500px] overflow-y-auto"
        >
          {filteredResults.length > 0 ? (
            <div className="py-2">
              {filteredResults.map((result, index) => {
                const Icon = result.icon
                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full px-4 py-3 flex items-start gap-3 hover:bg-accent transition-colors text-left",
                      index === selectedIndex && "bg-accent"
                    )}
                  >
                    <Icon className="size-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm truncate">{result.title}</div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                          {getCategoryBadge(result.category)}
                        </span>
                        {result.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex-shrink-0">
                            {result.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{result.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <Search className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium text-foreground">Keine Ergebnisse gefunden</p>
              <p className="text-xs text-muted-foreground mt-1">
                Versuchen Sie Projekt-, Rechnungs-, Kunden- oder Lieferantennummern
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
