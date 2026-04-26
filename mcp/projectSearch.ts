import type { Project } from '@teritamas/shared/projects';
import { projects } from '@teritamas/shared/projects';

export interface ProjectSearchInput {
  query?: string;
  tag?: string;
  year?: string;
  view?: ProjectViewPreference;
}

export type ProjectViewPreference =
  | 'auto'
  | 'cards'
  | 'table'
  | 'comparison'
  | 'spotlight';

export interface ProjectSearchResult {
  projects: Project[];
  totalCount: number;
  filters: {
    query?: string;
    tag?: string;
    year?: string;
  };
  availableTags: string[];
  availableYears: string[];
  generatedUi: GeneratedProjectUi;
}

export interface GeneratedProjectUi {
  kind: 'project-showcase';
  version: 1;
  layout: Exclude<ProjectViewPreference, 'auto'>;
  title: string;
  summary: string;
  emptyState: string;
  metrics: GeneratedProjectMetric[];
  tableColumns: GeneratedProjectTableColumn[];
}

export interface GeneratedProjectMetric {
  label: string;
  value: string;
}

export interface GeneratedProjectTableColumn {
  key: 'name' | 'year' | 'tags' | 'award' | 'links';
  label: string;
}

export function searchProjects(input: ProjectSearchInput): ProjectSearchResult {
  const filters = normalizeFilters(input);
  const filteredProjects = projects.filter((project) =>
    matchesFilters(project, filters),
  );

  const resultWithoutUi = {
    projects: filteredProjects,
    totalCount: filteredProjects.length,
    filters,
    availableTags: getUniqueSortedValues(projects.flatMap((project) => project.tags)),
    availableYears: getUniqueSortedValues(projects.map((project) => project.year)),
  };

  return {
    ...resultWithoutUi,
    generatedUi: generateProjectUi(resultWithoutUi, input.view ?? 'auto'),
  };
}

function normalizeFilters(input: ProjectSearchInput): ProjectSearchResult['filters'] {
  return {
    query: normalizeText(input.query),
    tag: normalizeText(input.tag),
    year: normalizeText(input.year),
  };
}

function matchesFilters(
  project: Project,
  filters: ProjectSearchResult['filters'],
): boolean {
  const normalizedQuery = filters.query?.toLowerCase();
  const normalizedTag = filters.tag?.toLowerCase();

  if (filters.year && project.year !== filters.year) {
    return false;
  }

  if (
    normalizedTag &&
    !project.tags.some((tag) => tag.toLowerCase() === normalizedTag)
  ) {
    return false;
  }

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    project.name,
    project.description,
    project.awards,
    ...project.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function normalizeText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function getUniqueSortedValues(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function generateProjectUi(
  result: Omit<ProjectSearchResult, 'generatedUi'>,
  view: ProjectViewPreference,
): GeneratedProjectUi {
  const layout = resolveLayout(result, view);

  return {
    kind: 'project-showcase',
    version: 1,
    layout,
    title: createTitle(result, layout),
    summary: createSummary(result, layout),
    emptyState:
      '条件に一致する作品はありません。年、タグ、キーワードを変えて再検索してください。',
    metrics: createMetrics(result),
    tableColumns: [
      { key: 'name', label: '作品名' },
      { key: 'year', label: '年' },
      { key: 'tags', label: '技術' },
      { key: 'award', label: '受賞' },
      { key: 'links', label: 'リンク' },
    ],
  };
}

function resolveLayout(
  result: Omit<ProjectSearchResult, 'generatedUi'>,
  view: ProjectViewPreference,
): Exclude<ProjectViewPreference, 'auto'> {
  if (view !== 'auto') {
    return view;
  }

  if (result.totalCount === 1) {
    return 'spotlight';
  }

  if (result.totalCount > 6) {
    return 'table';
  }

  if (result.filters.query || result.filters.tag) {
    return 'comparison';
  }

  return 'cards';
}

function createTitle(
  result: Omit<ProjectSearchResult, 'generatedUi'>,
  layout: GeneratedProjectUi['layout'],
): string {
  if (result.filters.query) {
    return `「${result.filters.query}」に関連する作品`;
  }

  if (result.filters.tag) {
    return `${result.filters.tag} を使った作品`;
  }

  if (result.filters.year) {
    return `${result.filters.year}年の作品`;
  }

  if (layout === 'table') {
    return '作品一覧';
  }

  return 'てりたまのハッカソン作品';
}

function createSummary(
  result: Omit<ProjectSearchResult, 'generatedUi'>,
  layout: GeneratedProjectUi['layout'],
): string {
  const countText = `${result.totalCount}件の作品`;

  if (layout === 'spotlight') {
    return `${countText}を詳しく表示しています。`;
  }

  if (layout === 'comparison') {
    return `${countText}を比較しやすい形で表示しています。`;
  }

  if (layout === 'table') {
    return `${countText}をスキャンしやすい表形式で表示しています。`;
  }

  return `${countText}をカード形式で表示しています。`;
}

function createMetrics(
  result: Omit<ProjectSearchResult, 'generatedUi'>,
): GeneratedProjectMetric[] {
  const awardCount = result.projects.filter((project) => project.awards).length;
  const tagCount = new Set(result.projects.flatMap((project) => project.tags)).size;

  return [
    { label: '作品数', value: String(result.totalCount) },
    { label: '受賞作品', value: String(awardCount) },
    { label: '技術タグ', value: String(tagCount) },
  ];
}
