//inicializacion de usuario en LocalStorage//
const defaultUser = {
    name: "Ash Ketchum",
    pin: "1234",
    account: "0987654321",
    balance: 500.0,
    transactions: []
  };
  
  if (!localStorage.getItem("pokebankUser")) {
    localStorage.setItem("pokebankUser", JSON.stringify(defaultUser));
  }  

//Mostrar Login con SweetAlert y Validate.js//
async function login() {
    const { value: pin } = await Swal.fire({
      title: "Bienvenido a PokéBank",
      input: "password",
      inputLabel: "Ingresa tu PIN",
      inputPlaceholder: "1234",
     
      confirmButtonText: "Acceder",
      showCancelButton: true,
inputAttributes: {
      maxlength: 4,
      inputmode: "numeric",
    
}
  });

 if (!pin) {
    login(); // vuelve a mostrar el login si se cancela o no se escribe nada
    return;
  }
    const constraints = {
      presence: true,
      format: {
        pattern: "^[0-9]{4}$",
        message: "debe tener 4 dígitos"
      }
    };
  
   if (!pin) {
  return; // Usuario canceló o no ingresó nada
}  
    const validation = validate({ pin:pin }, { pin: constraints });
  
    if (validation) {
      Swal.fire("Error", validation.pin[0], "error").then(() => login());
      return;
    }
  
    const user = JSON.parse(localStorage.getItem("pokebankUser"));
  
    if (pin === user.pin) {
      Swal.fire({
        title: `¡Hola ${user.name}!`,
        text: `Cuenta: ${user.account}`,
        icon: "success",
      }).then(() => {
        showMenu();
      });
    } else {
      Swal.fire("Error", "PIN incorrecto", "error").then(() => login());
    }
  }  

//Creacion menu de opciones//
function showMenu() {
    const user = JSON.parse(localStorage.getItem("pokebankUser"));
  
    Swal.fire({
      title: `Bienvenido, ${user.name}`,
      input: "select",
      inputOptions: {
        balance: "Consultar saldo",
        deposit: "Depositar dinero",
        withdraw: "Retirar dinero",
        chart: "Ver gráfico de transacciones",
        logout: "Salir"
      },
      inputPlaceholder: "Selecciona una opción",
      showCancelButton: false,
      confirmButtonText: "Aceptar"
    }).then(({ value }) => {
      if (!value){
showMenu(); //muestra el menu si no se selecciona nada o hace click afuera
return;
}
      switch (value) {
        case "balance":
          showBalance();
          break;
        case "deposit":
          handleTransaction("deposit");
          break;
        case "withdraw":
          handleTransaction("withdraw");
          break;
        case "chart":
          showChart();
          break;
        case "logout":
          Swal.fire("Sesión cerrada", "", "info").then(() => login());
          break;
      }
    });
  }
  

//Procesar transacciones y generar comprobante PDF//
function handleTransaction(type) {
    Swal.fire({
      title: type === "deposit" ? "Monto a depositar" : "Monto a retirar",
      input: "number",
      inputAttributes: { min: 1 },
      confirmButtonText: "Aceptar",
      showCancelButton: true
    }).then(({ isConfirmed, value }) => {
      if (!isConfirmed) {
        showMenu(); // Vuelve al menú si cancela
        return;
      }
  
      if (!value || value <= 0) {
        Swal.fire("Error", "Ingresa un monto válido", "error").then(() => showMenu());
        return;
      }
  
      const user = JSON.parse(localStorage.getItem("pokebankUser"));
  
      if (type === "withdraw" && value > user.balance) {
        Swal.fire("Error", "Fondos insuficientes", "error").then(() => showMenu());
        return;
      }
  
      user.balance += type === "deposit" ? +value : -value;
      user.transactions.push({ type, amount: +value, date: new Date().toISOString() });
  
      localStorage.setItem("pokebankUser", JSON.stringify(user));
  
      Swal.fire("Éxito", "Transacción realizada", "success").then(() => {
        generatePDF(user, type, value);
             });
    });
  }  
  
  function generatePDF(user, type, amount) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    doc.text("PokéBank - Comprobante", 10, 10);
    doc.text(`Nombre: ${user.name}`, 10, 20);
    doc.text(`Cuenta: ${user.account}`, 10, 30);
    doc.text(`Tipo: ${type}`, 10, 40);
    doc.text(`Monto: $${amount}`, 10, 50);
    doc.text(`Saldo: $${user.balance.toFixed(2)}`, 10, 60);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 10, 70);
  
    doc.save("comprobante.pdf");

    showMenu(); // Volver al menú después de una transacción exitosa
  }  
  
//Mostrar saldo//
function showBalance() {
    const user = JSON.parse(localStorage.getItem("pokebankUser"));
    Swal.fire("Saldo Actual", `$${user.balance.toFixed(2)}`, "info").then(() => {
      showMenu(); // Volver al menú después de ver el saldo
    });
  }  

//Mostrar grafico de transacciones con Chart.js//
let chartInstance = null;

function showChart() {
  const user = JSON.parse(localStorage.getItem("pokebankUser"));

  const typeCount = {
    deposit: 0,
    withdraw: 0,
  };

  user.transactions.forEach((t) => {
    if (typeCount[t.type] !== undefined) {
      typeCount[t.type]++;
    }
  });

  const ctx = document.getElementById("transactionChart").getContext("2d");

  // Destruye gráfico anterior si existe
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Muestra el contenedor del gráfico
  document.getElementById("chartContainer").style.display = "block";

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Depósitos", "Retiros"],
      datasets: [
        {
          label: "Cantidad de transacciones",
          data: [typeCount.deposit, typeCount.withdraw],
          backgroundColor: ["#4CAF50", "#F44336"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

//botorn para regresar al menú
  const backButton = document.createElement("button");
  backButton.textContent = "Volver al Menú";
  backButton.style.marginTop = "10px";
  backButton.style.padding = "10px 20px";
  backButton.style.backgroundColor = "#4CAF50";
  backButton.style.color = "white";
  backButton.style.border = "none";
  backButton.style.borderRadius = "5px";
  backButton.style.cursor = "pointer";

  document.getElementById("chartContainer").appendChild(backButton);

  backButton.addEventListener("click", () => {
    document.getElementById("chartContainer").style.display = "none";
    backButton.remove();  // Eliminamos el botón del DOM
    showMenu();           // Volvemos al menú principal
  });
}
 //Ejecutar cuando login se abra//
window.onload = login;
