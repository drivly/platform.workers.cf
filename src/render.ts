export function BuildTable(name: string, dataRows: any[]): string {
  const container = (value: string) => `<div class="dataContainer"><h3>${name}</h3>${value}</div>`;
  if (dataRows.length == 0) { return container('no data'); }
  const columns = Object.keys(dataRows[0]);
  const makeColumnsHead = (values: string[]) => values.map(value => `<th>${value}</th>`).join('');
  const makeColumnsData = (values: string[]) => values.map(value => `<td>${value}</td>`).join('');
  const makeRow = (value: string) => `<tr>${value}</tr>`;
  const table = `<table class="dataTable">${[
      makeRow(makeColumnsHead(columns)),
      dataRows.map(value => makeRow(makeColumnsData(Object.values(value)))).join('')
    ].join('')}</table>`;
  return container(table);
}

export const CSS: string = `
html {
  font-family: sans-serif;
}

body {
  padding: 10px;
}

.header {
  padding-bottom: 10px;
}

.dataContainer {
  padding: 0 0 5 0;
  max-width: 800px;
}

.dataTable {
  border-collapse: collapse;
  width: 100%;
}

.dataTable td, .dataTable th {
  border: 1px solid #ddd;
  padding: 8px;
}

.dataTable tr:nth-child(even){background-color: #f2f2f2;}

.dataTable tr:hover {background-color: #ddd;}

.dataTable th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  background-color: #f4801f;
  color: white;
}
`

export const HtmlPage = (body: string) => `
<!DOCTYPE html><html>
<head><style>${CSS}</style></head>
<body>
<div class="header">
  <h1>Workers for Platforms Example Project</h1>
  <a href="/init">initialize</a>
  <a href="/">admin</a>
  <a href="/upload">upload</a>
  <br /><br />
  <div>
    <input type="text" id="scriptUri" placeholder="script name">
    <button onclick="location.href='dispatch/' + document.getElementById('scriptUri').value">Go to script</button>
  </div>
</div>
${body}
</body>
</html>
`;

export const UploadPage = `
<h3>Customer Script Upload</h3>
<label for="token"><b>Customer Token</b></label>
<input type="text" id="token" value="a1b2c3"></input>

<br /><br />

<button onclick="getScripts()">Get scripts</button>

<br /><br />

<label for="scriptName"><b>Script Name</b></label>
<input type="text" id="scriptName" value="my-script"></input>

<br /><br />

<label for="scriptContents"><b>Script Contents</b></label>
<br />
<textarea id="scriptContents" name="scriptContents" rows="10" cols="50">
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
})

async function handleRequest(request) {
  return new Response("Hello world");
}
</textarea>

<br /><br />

<button onclick="upload()">Upload script</button>

<br /><br />

<h3>API Reponse</h3>
<div id="response">no request sent yet</div>

<script>
  const responseDiv = document.querySelector("#response");

  async function upload() {
    const token = document.querySelector("#token").value;
    const scriptName = document.querySelector("#scriptName").value;
    const scriptContents = document.querySelector("#scriptContents").value;

    responseDiv.innerHTML = "uploading..."

    const response = await fetch("/script/" + scriptName, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Customer-Token": token },
      body: JSON.stringify({ "script": scriptContents })
    });

    responseDiv.innerHTML = await response.text();
  }

  async function getScripts() {
    const token = document.querySelector("#token").value;

    responseDiv.innerHTML = "fetching..."

    const response = await fetch("/script", {
      method: "GET",
      headers: { "X-Customer-Token": token }
    });

    responseDiv.innerHTML = await response.text();
  }
</script>
`
