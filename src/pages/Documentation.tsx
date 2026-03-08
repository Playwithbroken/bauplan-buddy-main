import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  BookOpen,
  Calendar,
  FolderOpen,
  FileText,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Video,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  Star,
  Clock,
  TrendingUp,
  Filter,
  X,
} from "lucide-react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { userGuides } from "@/content/userGuides";
import { troubleshootingGuides, faqData } from "@/content/troubleshooting";
import { DocumentationService } from "@/services/documentationService";
import type {
  SearchResult,
  DocumentationSection as DocumentationSectionType,
} from "@/types/documentation";

interface DocumentationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  articles: DocumentationArticle[];
}

interface DocumentationArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  difficulty: "Anfänger" | "Fortgeschritten" | "Experte";
  lastUpdated: string;
  readTime: string;
  type: "guide" | "tutorial" | "reference" | "faq";
}

const Documentation: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    difficulty: [] as string[],
    type: [] as string[],
    section: [] as string[],
  });
  const [showFilters, setShowFilters] = useState(false);

  const documentationSections: DocumentationSection[] = useMemo(
    () => [
      {
        id: "getting-started",
        title: "Erste Schritte",
        icon: <BookOpen className="h-5 w-5" />,
        description: "Grundlagen und Einrichtung von Bauplan Buddy",
        articles: [
          {
            id: "interface-overview",
            title: "Benutzeroberfläche im Überblick",
            content:
              "Lernen Sie die wichtigsten Elemente der Benutzeroberfläche kennen...",
            tags: ["Interface", "Navigation", "Grundlagen"],
            difficulty: "Anfänger",
            lastUpdated: "2024-03-13",
            readTime: "7 min",
            type: "guide",
          },
        ],
      },
      {
        id: "appointments",
        title: "Terminverwaltung",
        icon: <Calendar className="h-5 w-5" />,
        description: "Termine erstellen, verwalten und organisieren",
        articles: Object.entries(userGuides.appointments).map(
          ([key, guide]) => ({
            id: key,
            title: guide.title,
            content: guide.content,
            tags: guide.tags,
            difficulty: guide.difficulty as
              | "Anfänger"
              | "Fortgeschritten"
              | "Experte",
            lastUpdated: "2024-03-15",
            readTime: guide.readTime,
            type: "guide" as const,
          })
        ),
      },
      {
        id: "projects",
        title: "Projektverwaltung",
        icon: <FolderOpen className="h-5 w-5" />,
        description: "Projekte planen, überwachen und abschließen",
        articles: Object.entries(userGuides.projects).map(([key, guide]) => ({
          id: key,
          title: guide.title,
          content: guide.content,
          tags: guide.tags,
          difficulty: guide.difficulty as
            | "Anfänger"
            | "Fortgeschritten"
            | "Experte",
          lastUpdated: "2024-03-14",
          readTime: guide.readTime,
          type: "guide" as const,
        })),
      },
      {
        id: "calendar",
        title: "Kalender-Integration",
        icon: <Calendar className="h-5 w-5" />,
        description: "Externe Kalender verbinden und synchronisieren",
        articles: Object.entries(userGuides.calendar).map(([key, guide]) => ({
          id: key,
          title: guide.title,
          content: guide.content,
          tags: guide.tags,
          difficulty: guide.difficulty as
            | "Anfänger"
            | "Fortgeschritten"
            | "Experte",
          lastUpdated: "2024-03-12",
          readTime: guide.readTime,
          type: "guide" as const,
        })),
      },
      {
        id: "troubleshooting",
        title: "Problemlösung",
        icon: <HelpCircle className="h-5 w-5" />,
        description: "Häufige Probleme und deren Lösungen",
        articles: Object.entries(troubleshootingGuides).map(([key, guide]) => ({
          id: key,
          title: guide.title,
          content: guide.content,
          tags: guide.tags,
          difficulty: guide.difficulty as
            | "Anfänger"
            | "Fortgeschritten"
            | "Experte",
          lastUpdated: "2024-03-10",
          readTime: guide.readTime,
          type: "faq" as const,
        })),
      },
    ],
    []
  );

  // Handle search with debouncing
  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearchMode(false);
        return;
      }

      // Use the advanced search from DocumentationService
      const results = DocumentationService.searchArticles(query);

      // Apply filters if any
      let filteredResults = results;

      if (searchFilters.difficulty.length > 0) {
        filteredResults = filteredResults.filter((result) =>
          searchFilters.difficulty.includes(result.article.difficulty)
        );
      }

      if (searchFilters.type.length > 0) {
        filteredResults = filteredResults.filter((result) =>
          searchFilters.type.includes(result.article.type)
        );
      }

      if (searchFilters.section.length > 0) {
        filteredResults = filteredResults.filter((result) =>
          searchFilters.section.includes(result.sectionId)
        );
      }

      setSearchResults(filteredResults);
      setIsSearchMode(true);
    },
    [searchFilters]
  );

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const filteredContent = useMemo(() => {
    if (isSearchMode) return [];
    return documentationSections;
  }, [isSearchMode, documentationSections]);

  // Safer highlight implementation to avoid regex injection and XSS via innerHTML
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const escapeRegExp = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlightSearchText = (text: string, query: string): string => {
    if (!query) return escapeHtml(text);
    const safeQuery = escapeRegExp(query);
    const parts = text.split(new RegExp(`(${safeQuery})`, "gi"));
    return parts
      .map((part, idx) =>
        idx % 2 === 1
          ? `<mark class="bg-yellow-200 font-medium">${escapeHtml(part)}</mark>`
          : escapeHtml(part)
      )
      .join("");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchMode(false);
  };

  const toggleFilter = (
    filterType: "difficulty" | "type" | "section",
    value: string
  ) => {
    setSearchFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter((v) => v !== value)
        : [...prev[filterType], value],
    }));
  };

  const clearAllFilters = () => {
    setSearchFilters({
      difficulty: [],
      type: [],
      section: [],
    });
  };

  const hasActiveFilters =
    searchFilters.difficulty.length > 0 ||
    searchFilters.type.length > 0 ||
    searchFilters.section.length > 0;

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Anfänger":
        return "bg-green-100 text-green-800";
      case "Fortgeschritten":
        return "bg-yellow-100 text-yellow-800";
      case "Experte":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "guide":
        return <BookOpen className="h-4 w-4" />;
      case "tutorial":
        return <Video className="h-4 w-4" />;
      case "reference":
        return <FileText className="h-4 w-4" />;
      case "faq":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Dokumentation" },
      ]}
    >
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <p className="text-lg text-gray-600 mb-6">
            Umfassende Anleitungen und Hilfestellungen für Bauplan Buddy
          </p>

          {/* Enhanced Search Bar */}
          <div className="space-y-4">
            <div className="flex gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Dokumentation durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {searchFilters.difficulty.length +
                      searchFilters.type.length +
                      searchFilters.section.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Search Filters */}
            {showFilters && (
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Suchfilter</h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                      >
                        Alle Filter löschen
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Difficulty Filter */}
                    <div>
                      <label className="text-sm font-medium">
                        Schwierigkeit
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Anfänger", "Fortgeschritten", "Experte"].map(
                          (difficulty) => (
                            <Badge
                              key={difficulty}
                              variant={
                                searchFilters.difficulty.includes(difficulty)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer"
                              onClick={() =>
                                toggleFilter("difficulty", difficulty)
                              }
                            >
                              {difficulty}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                      <label className="text-sm font-medium">Typ</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["guide", "tutorial", "reference", "faq"].map(
                          (type) => (
                            <Badge
                              key={type}
                              variant={
                                searchFilters.type.includes(type)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer"
                              onClick={() => toggleFilter("type", type)}
                            >
                              {type}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    {/* Section Filter */}
                    <div>
                      <label className="text-sm font-medium">Bereich</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {documentationSections.map((section) => (
                          <Badge
                            key={section.id}
                            variant={
                              searchFilters.section.includes(section.id)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => toggleFilter("section", section.id)}
                          >
                            {section.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Search Results Summary */}
            {isSearchMode && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Search className="h-4 w-4" />
                <span>
                  {searchResults.length} Ergebnis
                  {searchResults.length !== 1 ? "se" : ""}
                  für "{searchQuery}"
                </span>
                {hasActiveFilters && (
                  <span className="text-blue-600">mit aktiven Filtern</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isSearchMode ? "Suchergebnisse" : "Kategorien"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 p-4">
                    {isSearchMode ? (
                      // Search Results Sidebar
                      searchResults.length > 0 ? (
                        searchResults.map((result, index) => (
                          <div
                            key={`${result.sectionId}-${result.article.id}`}
                            className="p-3 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer bg-white"
                            onClick={() => {
                              setSelectedSection(result.sectionId);
                              setSelectedArticle(result.article.id);
                              setIsSearchMode(false);
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(result.article.type)}
                                <span className="text-sm font-medium">
                                  {result.sectionTitle}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Star className="h-3 w-3" />
                                {result.score}
                              </div>
                            </div>
                            <h4
                              className="font-medium text-sm mb-1"
                              dangerouslySetInnerHTML={{
                                __html: highlightSearchText(
                                  result.article.title,
                                  searchQuery
                                ),
                              }}
                            />
                            {result.snippets.length > 0 && (
                              <p
                                className="text-xs text-gray-600 line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: highlightSearchText(
                                    result.snippets[0],
                                    searchQuery
                                  ),
                                }}
                              />
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                className={getDifficultyColor(
                                  result.article.difficulty
                                )}
                              >
                                {result.article.difficulty}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {result.article.readTime}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Keine Ergebnisse gefunden</p>
                        </div>
                      )
                    ) : (
                      // Regular Categories Sidebar
                      filteredContent.map((section) => (
                        <Collapsible
                          key={section.id}
                          open={expandedSections.has(section.id)}
                          onOpenChange={() => toggleSection(section.id)}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              {section.icon}
                              <span className="font-medium">
                                {section.title}
                              </span>
                              <Badge variant="secondary" className="ml-auto">
                                {section.articles.length}
                              </Badge>
                            </div>
                            {expandedSections.has(section.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-1 mt-2 ml-4">
                            {section.articles.map((article) => (
                              <Button
                                key={article.id}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start h-auto p-2"
                                onClick={() => {
                                  setSelectedSection(section.id);
                                  setSelectedArticle(article.id);
                                }}
                              >
                                <div className="flex items-center gap-2 text-left">
                                  {getTypeIcon(article.type)}
                                  <span className="text-sm">
                                    {article.title}
                                  </span>
                                </div>
                              </Button>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedArticle && selectedSection ? (
              // Article View
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {
                          filteredContent
                            .find((s) => s.id === selectedSection)
                            ?.articles.find((a) => a.id === selectedArticle)
                            ?.title
                        }
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Info className="h-4 w-4" />
                          {
                            filteredContent
                              .find((s) => s.id === selectedSection)
                              ?.articles.find((a) => a.id === selectedArticle)
                              ?.readTime
                          }
                        </div>
                        <Badge
                          className={getDifficultyColor(
                            filteredContent
                              .find((s) => s.id === selectedSection)
                              ?.articles.find((a) => a.id === selectedArticle)
                              ?.difficulty || ""
                          )}
                        >
                          {
                            filteredContent
                              .find((s) => s.id === selectedSection)
                              ?.articles.find((a) => a.id === selectedArticle)
                              ?.difficulty
                          }
                        </Badge>
                        <span>
                          Zuletzt aktualisiert:{" "}
                          {
                            filteredContent
                              .find((s) => s.id === selectedSection)
                              ?.articles.find((a) => a.id === selectedArticle)
                              ?.lastUpdated
                          }
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSection(null);
                        setSelectedArticle(null);
                      }}
                    >
                      Zurück zur Übersicht
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p>
                      {
                        filteredContent
                          .find((s) => s.id === selectedSection)
                          ?.articles.find((a) => a.id === selectedArticle)
                          ?.content
                      }
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-6">
                      {filteredContent
                        .find((s) => s.id === selectedSection)
                        ?.articles.find((a) => a.id === selectedArticle)
                        ?.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Overview
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Schnelleinstieg</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col gap-2"
                        onClick={() => {
                          setSelectedSection("getting-started");
                          setSelectedArticle("installation");
                        }}
                      >
                        <BookOpen className="h-6 w-6" />
                        <span className="font-medium">Erste Schritte</span>
                        <span className="text-sm text-gray-600">
                          Installation & Setup
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col gap-2"
                        onClick={() => {
                          setSelectedSection("appointments");
                          setSelectedArticle("create-appointment");
                        }}
                      >
                        <Calendar className="h-6 w-6" />
                        <span className="font-medium">Termine verwalten</span>
                        <span className="text-sm text-gray-600">
                          Termine erstellen
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col gap-2"
                        onClick={() => {
                          setSelectedSection("troubleshooting");
                          setSelectedArticle("login-issues");
                        }}
                      >
                        <HelpCircle className="h-6 w-6" />
                        <span className="font-medium">Hilfe benötigt?</span>
                        <span className="text-sm text-gray-600">
                          Problemlösung
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Documentation Sections */}
                {filteredContent.map((section) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {section.icon}
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.articles.map((article) => (
                          <div
                            key={article.id}
                            className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                            onClick={() => {
                              setSelectedSection(section.id);
                              setSelectedArticle(article.id);
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium text-lg">
                                {article.title}
                              </h3>
                              {getTypeIcon(article.type)}
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {article.content.substring(0, 100)}...
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={getDifficultyColor(
                                    article.difficulty
                                  )}
                                >
                                  {article.difficulty}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {article.readTime}
                                </span>
                              </div>
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* No Results */}
                {searchQuery && filteredContent.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Keine Ergebnisse gefunden
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Für "{searchQuery}" wurden keine Dokumentationen
                        gefunden.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setSearchQuery("")}
                      >
                        Suche zurücksetzen
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default Documentation;
