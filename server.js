const puppeteer = require("puppeteer");
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});

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
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  const page = await browser.newPage();
  await page.goto(url, { timeout: 80000, waitUntil: "domcontentloaded" });
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

  await page.close();
  await browser.close();

  return data;
}
