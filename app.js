window.onload = function () {
  // Example of dynamically changing properties of VR elements
  const blockPanel = document.getElementById("blockPanel");

  // Example interaction: Rotate the block panel on click
  blockPanel.addEventListener("click", function () {
    this.setAttribute("rotation", {
      x: 0,
      y: this.object3D.rotation.y + 90,
      z: 0,
    });
  });

  const button = document.querySelector(".btn-container button");
  button.addEventListener("click", () => {
    const buttonId = button.id;

    const url = "/node.html?id=" + encodeURIComponent(buttonId);
    window.location.href = url;
  });

  AFRAME.registerComponent("change-color-on-hover", {
    schema: {
      color: { default: "red" },
    },

    init: function () {
      var data = this.data;
      var el = this.el; // <a-box>
      var defaultColor = el.getAttribute("material").color;

      el.addEventListener("mouseenter", function () {
        el.setAttribute("color", data.color);
      });

      el.addEventListener("mouseleave", function () {
        el.setAttribute("color", defaultColor);
      });
    },
  });
};

const trimTextWithEllipsis = (text, maxLength, transaction = null) => {
  try {
    // Check if the text is longer than the maximum allowed length
    if (text.length > maxLength) {
      // Trim the text to the maximum length minus 3 to accommodate the ellipsis
      // and then append '...'
      return text.substring(0, maxLength - 3) + "...";
    }
    // Return the text as is if it doesn't need trimming
    return text;
  } catch (err) {
    console.error(err);
  }
};

document.addEventListener("DOMContentLoaded", function () {
  const latestBlockText = document.getElementById("latestBlockText");
  const transactionTimeText = document.getElementById("transactionTimeText");
  let previousTransactions = [];
  let colorDecider = 1;
  const textColor = {
    0: "#ffff",
    1: "#280063",
    2: "#ff744a",
    3: "#fcba03",
  };

  // Function to fetch data from the Algorand API
  function fetchData() {
    fetch(
      "https://testnet-api.algonode.cloud/v2/status/wait-for-block-after/39606038"
    )
      .then((response) => response.json())
      .then((data) => {
        // Update the VR elements with new data
        latestBlockText.setAttribute("value", ` ${data["last-round"]}`);
        transactionTimeText.setAttribute(
          "value",
          ` ${data["time-since-last-round"]}`
        );
        fetchLatestTransactions(data["last-round"]);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        latestBlockText.setAttribute("value", "Failed to load data");
        transactionTimeText.setAttribute("value", "Failed to load data");
      });
  }

  const fetchLatestTransactions = async (latestBlock) => {
    const response = await fetch(
      `https://testnet-idx.algonode.cloud/v2/blocks/${latestBlock}`
    );

    const data = await response.json();

    // latest transactions
    const transactionsData = data.transactions;
    let allTransactions = [];

    // checking if there is data in the previous transactions. if yes, append it at the end
    if (previousTransactions.length > 0)
      allTransactions = transactionsData.concat(previousTransactions.slice());
    else allTransactions = [...transactionsData];

    previousTransactions = [...allTransactions];
    const displayTransactions = allTransactions.slice(0, 3);

    const transactionsElem = document.getElementById("latestTransactions");
    transactionsElem.innerHTML = "";

    let yOffset = 0; // Start position for the first item

    //decide text color
    const textColorCode = textColor[colorDecider % 4];

    displayTransactions.forEach((a) => {
      const transaction = { ...a };
      const entityEl = document.createElement("a-entity");
      entityEl.setAttribute("position", { x: 0, y: yOffset, z: 0 });

      const boxEl = document.createElement("a-box");
      boxEl.setAttribute("id", `${transaction.id}`);
      boxEl.setAttribute("position", "0 0 0");
      boxEl.setAttribute("cursor", "");
      boxEl.setAttribute("depth", "0.1");
      boxEl.setAttribute("height", "1");
      boxEl.setAttribute("width", "3");
      boxEl.setAttribute("color", "#268201");

      const idText = document.createElement("a-text");
      idText.setAttribute(
        "value",
        `ID: ${trimTextWithEllipsis(transaction.id, 25, transaction)}`
      );
      idText.setAttribute("color", textColorCode);
      idText.setAttribute("align", "left");
      idText.setAttribute("position", "-1.5 0.3 0.05");
      idText.setAttribute("width", "3");

      const senderText = document.createElement("a-text");
      senderText.setAttribute(
        "value",
        `Sender: ${trimTextWithEllipsis(transaction.sender, 25)}`
      );
      senderText.setAttribute("color", textColorCode);
      senderText.setAttribute("position", "-1.5 0 0.05");
      senderText.setAttribute("width", "3");
      senderText.setAttribute("align", "left");

      const receiverText = document.createElement("a-text");
      const receiverData = transaction["payment-transaction"]
        ? transaction["payment-transaction"].receiver
        : "";
      receiverText.setAttribute(
        "value",
        `Receiver: ${trimTextWithEllipsis(receiverData, 25)}`
      );
      receiverText.setAttribute("color", textColorCode);
      receiverText.setAttribute("position", "-1.5 -0.3 0.05");
      receiverText.setAttribute("width", "3");
      receiverText.setAttribute("align", "left");

      // Append texts to box
      entityEl.appendChild(boxEl);
      entityEl.appendChild(idText);
      entityEl.appendChild(senderText);
      entityEl.appendChild(receiverText);
      transactionsElem.appendChild(entityEl);

      // boxEl.addEventListener("click", () => {
      //   alert(trimTextWithEllipsis(transaction.id, 5));
      // });

      yOffset += 1.2;
    });

    const lastTransaction = previousTransactions[0];
    const lastTransactionTextElement = document.getElementById(
      "lastTransactionText"
    );
    const button = document.querySelector(".btn-container button");
    button.setAttribute("id", `${lastTransaction.sender}`);
    lastTransactionTextElement.setAttribute(
      "value",
      `Account - ${lastTransaction.sender}`
    );

    colorDecider += 1;

    // removing transactions that are older than last 3 transactions
    if (previousTransactions.length > 10) {
      previousTransactions.slice(5, previousTransactions.length);
      console.log(previousTransactions);
    }
  };

  // Initial fetch
  fetchData();

  // Set to fetch new data every 5 seconds
  setInterval(fetchData, 5000);
});
