const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");

app.use(bodyParser.json());

app.post("/process", async (req, res) => {
  const codicePersonale = await req.body.codicePersonale;
  const password = await req.body.password;

  try {
    const data = await fetchData(codicePersonale, password);

    res.send({
      data: data,
    });
  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({ error: "Timeout during navigation" });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

async function fetchData(codicePersonale, password) {
  const url = "https://web.spaggiari.eu/cvv/app/default/genitori_voti.php";
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.type("#login", await codicePersonale);
  await page.type("#password", await password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.click(".accedi"),
  ]);

  const data = await page.evaluate(() => {
    const containerClass = document.querySelectorAll(
      ".riga_materia_componente"
    );
    const result = [];

    containerClass.forEach((item) => {
      const nomeMateria = item
        .querySelector(".materia_desc")
        .textContent.trim();
      const votiMateria = item.querySelectorAll(
        '[class*=":sfondocella_2: cella_div"]'
      );

      const esiti = Array.from(votiMateria).map((votoItem) => {
        const valutazione = votoItem.querySelector(
          ".double.s_reg_testo.cella_trattino"
        ).innerHTML;

        if (votoItem.className.includes("positivo")) {
          return { Esito: "Positivo", Valutazione: valutazione };
        } else if (votoItem.className.includes("negativo")) {
          return { Esito: "Negativo", Valutazione: valutazione };
        } else {
          return { Esito: "In Blu", Valutazione: valutazione };
        }
      });

      result.push({
        Nome_Materia: nomeMateria,
        Esiti: esiti,
      });
    });

    return result;
  });

  await browser.close();

  return data;
}
