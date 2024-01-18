let codicePersonale = document.getElementById("codicePersonale");
const password = document.getElementById("password");
const alertText = document.getElementById("alertText");
const eyeIcon = document.getElementById("eyeIcon");
let showPassword = false;
const loginBtn = document.getElementById("loginBtn");
let loginPageContainer = document.getElementById("loginPageContainer");
let viewPageContainer = document.getElementById("viewPageContainer");
let loadPageContainer = document.getElementById("loadPageContainer");
let errorPage = document.getElementById("errorPage");
let noNewVotePageContainer = document.getElementById("noNewVotePageContainer");
let riprovareBtn = document.getElementById("riprovareBtn");
let esito = document.getElementById("esito");
let noNewVoteBtn = document.getElementById("noNewVoteBtn");

eyeIcon.addEventListener("click", () => {
  showPassword = !showPassword;

  if (showPassword) {
    eyeIcon.src = "./images/hide.png";
    password.setAttribute("type", "text");
  } else {
    eyeIcon.src = "./images/show.png";
    password.setAttribute("type", "password");
  }
});

loginBtn.addEventListener("click", () => {
  if (codicePersonale.value !== "" && password.value !== "") {
    loginPageContainer.style.display = "none";
    loadPageContainer.style.display = "flex";

    let codicePersonaleValue = codicePersonale.value;
    let passwordValue = password.value;

    fetch("/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codicePersonale: codicePersonaleValue,
        password: passwordValue,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          loadPageContainer.style.display = "none";
          viewPageContainer.style.display = "none";
          loginPageContainer.style.display = "none";
          errorPage.style.display = "flex";
          throw new Error("Response not OK");
        }
        return response.json();
      })
      .then((data) => {
        let checkNuovoVoto = false;
        if (data) {
          loadPageContainer.style.display = "none";
          viewPageContainer.style.display = "flex";
          let nomeTemp;
          let esitoTemp;

          for (let i in data) {
            for (let j in data[i]) {
              for (let k in data[i][j].Esiti) {
                if (data[i][j].Esiti[k].Valutazione == "") {
                  checkNuovoVoto = true;
                  nomeTemp = data[i][j].Nome_Materia;
                  esitoTemp = data[i][j].Esiti[k].Esito;
                  createRow(nomeTemp, esitoTemp);
                }
                // console.log("valutazione", nomeTemp && esitoTemp);
              }
            }
          }

          if (!checkNuovoVoto) {
            console.log("nessun nuovo voto");
            loadPageContainer.style.display = "none";
            viewPageContainer.style.display = "none";
            loginPageContainer.style.display = "none";
            errorPage.style.display = "none";
            noNewVotePageContainer.style.display = "flex";
          }

          // console.log("completo", data);
        } else {
          loadPageContainer.style.display = "none";
          viewPageContainer.style.display = "flex";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    alertText.classList.add("alertTextUnderline");
  }
});

riprovareBtn.addEventListener("click", () => {
  errorPage.style.display = "none";
  loadPageContainer.style.display = "none";
  viewPageContainer.style.display = "none";
  noNewVotePageContainer.style.display = "none";

  codicePersonale.value = "";
  password.value = "";

  loginPageContainer.style.display = "flex";
});

noNewVoteBtn.addEventListener("click", () => {
  errorPage.style.display = "none";
  loadPageContainer.style.display = "none";
  viewPageContainer.style.display = "none";
  noNewVotePageContainer.style.display = "none";

  codicePersonale.value = "";
  password.value = "";

  loginPageContainer.style.display = "flex";
});

async function createRow(nomeMateriaParam, esitoParam) {
  const nomeMateria =
    nomeMateriaParam.charAt(0).toUpperCase() + nomeMateriaParam.slice(1);
  const esito = await esitoParam;

  const divContainer = document.createElement("div");
  divContainer.classList.add("esitiRow");
  viewPageContainer.appendChild(divContainer);

  const paragraph = document.createElement("p");
  paragraph.textContent = nomeMateria;
  divContainer.appendChild(paragraph);

  const esitoContainer = document.createElement("div");
  esitoContainer.classList.add("esito");
  divContainer.appendChild(esitoContainer);

  const cellaContainer = document.createElement("div");
  cellaContainer.classList.add("cella");
  if (esito == "Positivo") {
    cellaContainer.textContent = "P";
    cellaContainer.style.backgroundColor = "#008000";
  } else if (esito == "Negativo") {
    cellaContainer.textContent = "N";
    cellaContainer.style.backgroundColor = "#ff0000";
  } else {
    cellaContainer.textContent = "B";
    cellaContainer.style.backgroundColor = "#0080b8";
  }

  esitoContainer.appendChild(cellaContainer);

  // console.log("indice", `${parseInt(index) + 1}° Nuovo Voto`);

  const indiceVoto = document.createElement("p");
  indiceVoto.textContent = `Nuovo Voto Materia`;
  esitoContainer.appendChild(indiceVoto);

  // console.log(esito);
}
