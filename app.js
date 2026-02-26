import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, onSnapshot, query, orderBy,
  updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAWt2kxrKuLNvE-GZGlMrS6aFNm39myzsk",
    authDomain: "brita-boyz-trades.firebaseapp.com",
    projectId: "brita-boyz-trades",
    storageBucket: "brita-boyz-trades.firebasestorage.app",
    messagingSenderId: "571942229076",
    appId: "1:571942229076:web:4b01436d4a3949e47f89c1",
    measurementId: "G-RZLDQ61015"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
const firebaseConfig = {
  apiKey: "PASTE_YOURS",
  authDomain: "PASTE_YOURS",
  projectId: "PASTE_YOURS",
  storageBucket: "PASTE_YOURS",
  messagingSenderId: "PASTE_YOURS",
  appId: "PASTE_YOURS",
};

const OWNERS = ["JCort", "Troy", "Tristan", "Charmin", "Kade"];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app);
const toast = document.getElementById("toast");
function showError(msg){
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 7000);
}

try {
  await signInAnonymously(auth);
} catch (err) {
  console.error(err);
  showError("Auth error: " + (err?.message || err));
} // keeps it simple for public access

// UI refs
const newTradeBtn = document.getElementById("newTradeBtn");
const tradeModal = document.getElementById("tradeModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalBtn = document.getElementById("closeModalBtn");
const tradeForm = document.getElementById("tradeForm");

const weReceiveEl = document.getElementById("weReceive");
const weOfferEl = document.getElementById("weOffer");
const notesEl = document.getElementById("notes");
const tradeList = document.getElementById("tradeList");

function openModal() {
  tradeModal.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
  weReceiveEl.focus();
}

function closeModal() {
  tradeModal.classList.add("hidden");
  modalBackdrop.classList.add("hidden");
  tradeForm.reset();
  document.getElementById("winnerUs").checked = true;
}

newTradeBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

// Create trade
tradeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // Build approvals object (all unchecked at creation)
    const approvals = {};
    for (const o of OWNERS) approvals[o] = false;

    // Optional: winner field (only if you have this input in your HTML)
    const winnerEl = document.querySelector('input[name="winner"]:checked');
    const winner = winnerEl ? winnerEl.value : "";

    // Create the trade doc
    await addDoc(collection(db, "trades"), {
      weSend: weOfferEl.value.trim(),
      weReceive: weReceiveEl.value.trim(),
      winner,
      notes: notesEl.value.trim(),
      approvals,
      createdAt: serverTimestamp(),
    });

    closeModal();
    tradeForm.reset();
  } catch (err) {
    console.error(err);
    showError("Submit error: " + (err?.message || err));
  }
});

  const winner = document.querySelector('input[name="winner"]:checked')?.value ?? "us";

  const approvals = {};
  for (const o of OWNERS) approvals[o] = false;

  await addDoc(collection(db, "trades"), {
    weReceive: weReceiveEl.value.trim(),
    weOffer: weOfferEl.value.trim(),
    winner,
    notes: notesEl.value.trim(),
    approvals,
    createdAt: serverTimestamp(),
  });

  closeModal();
});

// Render list realtime
const q = query(collection(db, "trades"), orderBy("createdAt", "desc"));

onSnapshot(q, (snap) => {
  tradeList.innerHTML = "";

  if (snap.empty) {
    tradeList.innerHTML = `<div class="item"><div class="meta">No trades yet.</div></div>`;
    return;
  }

  snap.forEach((d) => {
    const trade = d.data();
    const id = d.id;

    const createdAt = trade.createdAt?.toDate?.();
    const dateStr = createdAt
      ? new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(createdAt)
      : "just now";

    const approvals = trade.approvals || {};
    const approvedCount = OWNERS.reduce((n, o) => n + (approvals[o] ? 1 : 0), 0);
    const allApproved = approvedCount === OWNERS.length;

    const item = document.createElement("div");
    item.className = "item";

    item.innerHTML = `
      <div class="itemTop">
        <div>
          <div class="meta">Submitted: ${escapeHtml(dateStr)}</div>
          <div class="pillRow">
            <div class="pill"><b>We Receive:</b> ${escapeHtml(trade.weReceive || "")}</div>
            <div class="pill"><b>We Offer:</b> ${escapeHtml(trade.weOffer || "")}</div>
            <div class="pill"><b>Bible Winner:</b> ${escapeHtml(trade.winner === "them" ? "Them" : "Us")}</div>
            ${trade.notes ? `<div class="pill"><b>Notes:</b> ${escapeHtml(trade.notes)}</div>` : ""}
          </div>
        </div>
        <button class="deleteBtn" title="Delete">✕</button>
      </div>

      <div class="approvals">
        <div class="approvalsTitle">Confirmation — only select your box</div>
        <div class="checkGrid">
          ${OWNERS.map((o) => `
            <label class="check">
              <input type="checkbox" data-owner="${escapeHtml(o)}" ${approvals[o] ? "checked" : ""}/>
              <span>${escapeHtml(o)}</span>
            </label>
          `).join("")}
        </div>

        ${allApproved ? `<div class="approved">✅ APPROVED — SEND OFFER</div>` : ""}
      </div>
    `;

    // checkbox listeners
    item.querySelectorAll('input[type="checkbox"][data-owner]').forEach((cb) => {
      cb.addEventListener("change", async (ev) => {
        const owner = ev.target.getAttribute("data-owner");
        const checked = ev.target.checked;

        const ref = doc(db, "trades", id);
        await updateDoc(ref, {
          [`approvals.${owner}`]: checked
        });
      });
    });

    // delete listener
    item.querySelector(".deleteBtn").addEventListener("click", async () => {
      const ok = confirm("Are you sure you want to delete this trade?");
      if (!ok) return;

      await deleteDoc(doc(db, "trades", id));
    });

    tradeList.appendChild(item);
  });
});

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
