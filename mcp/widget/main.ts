import { App } from '@modelcontextprotocol/ext-apps';
import './styles.css';

interface Project {
  name: string;
  year: string;
  icon: string;
  description: string;
  tags: string[];
  github: string;
  youtube?: string;
  awards?: string;
}

interface ProjectSearchResult {
  projects: Project[];
  totalCount: number;
  filters: {
    query?: string;
    tag?: string;
    year?: string;
  };
  availableTags: string[];
  availableYears: string[];
  generatedUi?: GeneratedProjectUi;
}

interface GeneratedProjectUi {
  kind: 'project-showcase';
  version: 1;
  layout: 'cards' | 'table' | 'comparison' | 'spotlight';
  title: string;
  summary: string;
  emptyState: string;
  metrics: GeneratedProjectMetric[];
  tableColumns: GeneratedProjectTableColumn[];
}

interface GeneratedProjectMetric {
  label: string;
  value: string;
}

interface GeneratedProjectTableColumn {
  key: 'name' | 'year' | 'tags' | 'award' | 'links';
  label: string;
}

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Generative UI root element was not found.');
}

let latestResult: ProjectSearchResult = {
  projects: [],
  totalCount: 0,
  filters: {},
  availableTags: [],
  availableYears: [],
};

const generativeUI = new App(
  { name: 'teritamas-generative-ui', version: '0.1.0' },
  {},
  { autoResize: true }
);

render(latestResult);

generativeUI.ontoolresult = (params) => {
  latestResult = normalizeResult(params.structuredContent);
  render(latestResult);
};

void generativeUI.connect().catch(() => {
  render(latestResult);
});

function normalizeResult(value: unknown): ProjectSearchResult {
  if (!isProjectSearchResult(value)) {
    return latestResult;
  }

  return value;
}

function isProjectSearchResult(value: unknown): value is ProjectSearchResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ProjectSearchResult>;
  return (
    Array.isArray(candidate.projects) &&
    typeof candidate.totalCount === 'number'
  );
}

function render(result: ProjectSearchResult): void {
  root.replaceChildren(createGenerativeUI(result));
}

function createGenerativeUI(result: ProjectSearchResult): HTMLElement {
  const generatedUi = result.generatedUi ?? createFallbackUi(result);
  const container = createElement('section', 'project-generative-ui');

  const header = createElement('header', 'project-generative-ui__header');
  header.append(
    createElement('p', 'project-generative-ui__eyebrow', 'Portfolio Showcase'),
    createElement('h1', 'project-generative-ui__title', generatedUi.title),
    createElement('p', 'project-generative-ui__summary', generatedUi.summary)
  );

  const metrics = createMetrics(generatedUi.metrics);
  const filters = createElement('div', 'project-generative-ui__filters');
  appendFilter(filters, 'Keyword', result.filters.query);
  appendFilter(filters, 'Tag', result.filters.tag);
  appendFilter(filters, 'Year', result.filters.year);
  appendFilter(filters, 'Layout', generatedUi.layout);

  const projectList = createGeneratedLayout(result.projects, generatedUi);

  container.append(header, metrics, filters, projectList);
  return container;
}

function createFallbackUi(result: ProjectSearchResult): GeneratedProjectUi {
  return {
    kind: 'project-showcase',
    version: 1,
    layout: 'cards',
    title: 'Hackathon project showcase',
    summary:
      result.totalCount > 0
        ? `${result.totalCount} projects match the current request.`
        : 'Ask ChatGPT to show Teritamas projects, filter by year, or search by tag.',
    emptyState: 'No projects are loaded yet.',
    metrics: [
      { label: 'Projects', value: String(result.totalCount) },
      {
        label: 'Awarded',
        value: String(
          result.projects.filter((project) => project.awards).length
        ),
      },
      {
        label: 'Tags',
        value: String(
          new Set(result.projects.flatMap((project) => project.tags)).size
        ),
      },
    ],
    tableColumns: [
      { key: 'name', label: 'Name' },
      { key: 'year', label: 'Year' },
      { key: 'tags', label: 'Tags' },
      { key: 'award', label: 'Award' },
      { key: 'links', label: 'Links' },
    ],
  };
}

function createMetrics(metrics: GeneratedProjectMetric[]): HTMLElement {
  const list = createElement('dl', 'project-generative-ui__metrics');
  list.append(
    ...metrics.map((metric) => {
      const item = createElement('div', 'project-generative-ui__metric');
      item.append(
        createElement('dt', 'project-generative-ui__metric-label', metric.label),
        createElement('dd', 'project-generative-ui__metric-value', metric.value)
      );
      return item;
    })
  );
  return list;
}

function createGeneratedLayout(
  projects: Project[],
  generatedUi: GeneratedProjectUi
): HTMLElement {
  if (projects.length === 0) {
    return createElement('p', 'project-generative-ui__empty', generatedUi.emptyState);
  }

  if (generatedUi.layout === 'table') {
    return createProjectTable(projects, generatedUi.tableColumns);
  }

  if (generatedUi.layout === 'comparison') {
    const grid = createElement('div', 'project-generative-ui__comparison');
    grid.append(...projects.map(createComparisonCard));
    return grid;
  }

  if (generatedUi.layout === 'spotlight') {
    return createSpotlight(projects[0]);
  }

  const grid = createElement('div', 'project-generative-ui__grid');
  grid.append(...projects.map(createProjectCard));
  return grid;
}

function appendFilter(
  parent: HTMLElement,
  label: string,
  value: string | undefined
): void {
  if (!value) {
    return;
  }

  const filter = createElement('span', 'project-generative-ui__filter');
  filter.append(
    createElement('strong', undefined, `${label}: `),
    document.createTextNode(value)
  );
  parent.append(filter);
}

function createProjectCard(project: Project): HTMLElement {
  const card = createElement('article', 'project-card');
  const icon = createProjectIcon(project);
  const body = createElement('div', 'project-card__body');
  const titleRow = createElement('div', 'project-card__title-row');
  const title = createElement('h2', 'project-card__title', project.name);
  const year = createElement('span', 'project-card__year', project.year);
  const description = createElement(
    'p',
    'project-card__description',
    project.description
  );
  const tags = createElement('div', 'project-card__tags');
  const links = createElement('div', 'project-card__links');

  titleRow.append(title, year);
  tags.append(
    ...project.tags.map((tag) =>
      createElement('span', 'project-card__tag', tag)
    )
  );
  links.append(createLinkButton('GitHub', project.github));

  if (project.youtube) {
    links.append(createLinkButton('YouTube', project.youtube));
  }

  body.append(titleRow);

  if (project.awards) {
    body.append(createElement('p', 'project-card__award', project.awards));
  }

  body.append(description, tags, links);
  card.append(icon, body);
  return card;
}

function createComparisonCard(project: Project): HTMLElement {
  const card = createProjectCard(project);
  card.classList.add('project-card--comparison');

  const facts = createElement('dl', 'project-card__facts');
  facts.append(
    createFact('年', project.year),
    createFact('技術数', `${project.tags.length}`),
    createFact('受賞', project.awards ? 'あり' : 'なし')
  );

  card.append(facts);
  return card;
}

function createSpotlight(project: Project): HTMLElement {
  const spotlight = createElement('article', 'project-spotlight');
  const icon = createProjectIcon(project);
  const content = createElement('div', 'project-spotlight__content');
  const links = createElement('div', 'project-card__links');

  links.append(createLinkButton('GitHub', project.github));

  if (project.youtube) {
    links.append(createLinkButton('YouTube', project.youtube));
  }

  content.append(
    createElement('p', 'project-widget__eyebrow', project.year),
    createElement('h2', 'project-spotlight__title', project.name),
    createElement('p', 'project-spotlight__description', project.description),
    createTagList(project.tags)
  );

  if (project.awards) {
    content.append(createElement('p', 'project-card__award', project.awards));
  }

  content.append(links);
  spotlight.append(icon, content);
  return spotlight;
}

function createProjectTable(
  projects: Project[],
  columns: GeneratedProjectTableColumn[]
): HTMLElement {
  const wrapper = createElement('div', 'project-table');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const headerRow = document.createElement('tr');

  columns.forEach((column) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column.label;
    headerRow.append(th);
  });

  projects.forEach((project) => {
    const row = document.createElement('tr');
    columns.forEach((column) => {
      row.append(createTableCell(project, column.key));
    });
    tbody.append(row);
  });

  thead.append(headerRow);
  table.append(thead, tbody);
  wrapper.append(table);
  return wrapper;
}

function createTableCell(
  project: Project,
  key: GeneratedProjectTableColumn['key']
): HTMLTableCellElement {
  const cell = document.createElement('td');

  if (key === 'name') {
    cell.append(createElement('strong', undefined, project.name));
    return cell;
  }

  if (key === 'year') {
    cell.textContent = project.year;
    return cell;
  }

  if (key === 'tags') {
    cell.append(createTagList(project.tags));
    return cell;
  }

  if (key === 'award') {
    cell.textContent = project.awards ?? '-';
    return cell;
  }

  const links = createElement('div', 'project-card__links');
  links.append(createLinkButton('GitHub', project.github));

  if (project.youtube) {
    links.append(createLinkButton('YouTube', project.youtube));
  }

  cell.append(links);
  return cell;
}

function createTagList(tags: string[]): HTMLElement {
  const tagList = createElement('div', 'project-card__tags');
  tagList.append(
    ...tags.map((tag) => createElement('span', 'project-card__tag', tag))
  );
  return tagList;
}

function createFact(label: string, value: string): HTMLElement {
  const fact = createElement('div', 'project-card__fact');
  fact.append(
    createElement('dt', 'project-card__fact-label', label),
    createElement('dd', 'project-card__fact-value', value)
  );
  return fact;
}

function createProjectIcon(project: Project): HTMLElement {
  const wrapper = createElement('div', 'project-card__icon');

  if (project.icon.startsWith('http')) {
    const image = document.createElement('img');
    image.src = project.icon;
    image.alt = `${project.name} logo`;
    image.loading = 'lazy';
    image.decoding = 'async';
    wrapper.append(image);
    return wrapper;
  }

  wrapper.textContent = project.icon;
  return wrapper;
}

function createLinkButton(label: string, url: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'project-card__link';
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', () => {
    void openExternalLink(url);
  });
  return button;
}

async function openExternalLink(url: string): Promise<void> {
  try {
    await generativeUI.openLink({ url });
    return;
  } catch {
    // Browser previews do not expose host link handling.
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}
