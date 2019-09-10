const headerEl = document.getElementById("header");
const contentEl = document.getElementById("content");

export function renderPage(pageState) {
  headerEl.innerHTML = "";
  contentEl.innerHTML = "";
  renderHeader(pageState.title);
  renderTable(pageState.tableData);
}

const HEADER_LABELS = [
  "symbol",
  "current",
  "change",
  "",
  "updated at",
  "with data from"
];

export function renderTable(tableData) {
  const containerEl = document.createElement("div");
  containerEl.className = `home`;
  const titleEl = document.createElement("h1");
  titleEl.className = "container-title";
  titleEl.innerText = "Popular Stocks";
  containerEl.append(titleEl);

  if (tableData && tableData.length) {
    const tableEl = document.createElement("div");
    tableEl.className = "table";
    const headerRow = document.createElement("div");
    headerRow.className = "row";
    HEADER_LABELS.forEach(label => {
      const headerCell = document.createElement("div");
      headerCell.className = "header-cell";
      headerCell.innerText = label;
      headerRow.append(headerCell);
    });
    tableEl.append(headerRow);
    tableData.forEach(rowData => renderRow(tableEl, rowData));
    containerEl.append(tableEl);
  }
  contentEl.append(containerEl);
}

export function renderRow(tableEl, rowData) {
  const { symbol, value, delta, timestamp } = rowData;
  const changeClasses = ["cell"];
  if (delta > 0) {
    changeClasses.push("positive");
  } else if (delta < 0) {
    changeClasses.push("negative");
  }
  const rowEl = document.createElement("div");
  rowEl.className = "row";
  
  const symbolCell = document.createElement("div");
  symbolCell.className = "cell symbol-cell";
  const symbolBlock = document.createElement("div");
  symbolBlock.className = "symbol-block";
  symbolBlock.innerText = symbol;
  symbolCell.append(symbolBlock);
  rowEl.append(symbolCell);

  const priceCell = document.createElement("div");
  priceCell.className = "cell price-cell";
  priceCell.innerText = value ? value.toFixed(2) : "-";
  rowEl.append(priceCell);

  const changeCell = document.createElement("div");
  changeCell.className = changeClasses.join(" ");
  changeCell.innerText = delta ? delta.toFixed(2) : "-";
  rowEl.append(changeCell);

  const arrowCell = document.createElement("div");
  arrowCell.className = "cell";
  const arrow = document.createElement("div");
  arrow.className = delta > 0 ? "arrow-up" : "arrow-down";
  arrowCell.append(arrow);
  rowEl.append(arrowCell);

  const dateUpdatedCell = document.createElement("div");
  dateUpdatedCell.className = "cell date-cell";
  dateUpdatedCell.innerText = new Date().toLocaleString();
  rowEl.append(dateUpdatedCell);

  const dateFromCell = document.createElement("div");
  dateFromCell.className = "cell date-cell";
  dateFromCell.innerText = new Date(timestamp).toLocaleString();
  rowEl.append(dateFromCell);

  tableEl.append(rowEl);
}

export function renderHeader(title) {
  const titleEl = document.createElement("h1");
  titleEl.className = "title";
  titleEl.innerText = title;
  headerEl.append(titleEl);
  const navEl = document.createElement('nav');
  const routes = ['full', 'split', 'dynamic'];
  routes.forEach(route => {
    const linkEl = document.createElement('a');
    linkEl.href = `/${route}`;
    linkEl.innerText = route;
    if (window.location.href.includes(`/${route}`)) {
      linkEl.className = 'active';
    }
    navEl.append(linkEl);
  });
  const loginButton = document.createElement('button');
  loginButton.textContent = 'login';
  loginButton.className = 'login-button';
  navEl.append(loginButton);
  headerEl.append(navEl);
}

export function logPerformance() {
  if (!performance) return;
  performance.getEntries().forEach(entry => {
    let label = entry.name;
    let time = entry.duration
    let navStart = 0;
    if (entry.entryType === 'navigation') {
      label = 'loadEventEnd';
      navStart = entry.startTime;
    } else if (entry.entryType === 'resource') {
      if (entry.name.includes('googleapis')) {
        label = 'Firestore channel';
      } else {
        const parts = entry.name.split('/');
        label = 'resource: ' + parts[parts.length - 1];
      }
    } else if (entry.entryType === 'paint') {
      time = entry.startTime - navStart;
    }
    console.log(label, Math.round(time));
  });
}