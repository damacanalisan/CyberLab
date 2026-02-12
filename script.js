const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const appState = {
  defenseMode: false,
  instructorMode: false,
  chain: {
    password: false,
    phishing: false,
    crypto: false,
    osint: false,
    burp: false,
    nmap: false,
  },
};

function setResult(el, message, ok) {
  el.textContent = message;
  el.classList.remove("ok", "bad");
  if (ok === true) el.classList.add("ok");
  if (ok === false) el.classList.add("bad");
}

function setInstructor(message) {
  if (!appState.instructorMode) return;
  document.getElementById("instructorBox").textContent = `Eğitmen Modu: ${message}`;
}

function updateChain(stepKey) {
  appState.chain[stepKey] = true;
  Object.entries(appState.chain).forEach(([k, v]) => {
    const li = document.getElementById(`chain-${k}`);
    li.textContent = `${li.textContent.split(" ")[0]} ${v ? "✅" : "⏳"}`;
  });
}

(function globalModes() {
  const defenseToggle = document.getElementById("defenseModeToggle");
  const instructorToggle = document.getElementById("instructorModeToggle");
  const tips = document.querySelectorAll(".defense-tip");

  tips.forEach((t) => t.classList.add("hidden"));

  defenseToggle.addEventListener("change", () => {
    appState.defenseMode = defenseToggle.checked;
    tips.forEach((t) => t.classList.toggle("hidden", !appState.defenseMode));
  });

  instructorToggle.addEventListener("change", () => {
    appState.instructorMode = instructorToggle.checked;
    document.getElementById("instructorBox").textContent = appState.instructorMode
      ? "Eğitmen notları aktif. Simülasyon adımlarında açıklamalar göreceksin."
      : "Eğitmen notları burada görünecek.";
  });
})();

function randomStrongPassword() {
  const symbols = "!@#$%&*";
  const full = `${charset}${symbols}`;
  let pass = "";
  for (let i = 0; i < 14; i += 1) pass += full[Math.floor(Math.random() * full.length)];
  return pass;
}

(function passwordSimulation() {
  const crackBtn = document.getElementById("startCrackBtn");
  const targetPasswordInput = document.getElementById("targetPassword");
  const attemptEl = document.getElementById("attempt");
  const attemptCountEl = document.getElementById("attemptCount");
  const timeLeftEl = document.getElementById("timeLeft");
  const strategyEl = document.getElementById("activeStrategy");
  const crackResultEl = document.getElementById("crackResult");
  const strongSuggestionEl = document.getElementById("strongSuggestion");

  let timer;
  const words = ["admin", "password", "letmein", "welcome", "admin123", "football"];

  function randomGuess(length) {
    let out = "";
    for (let i = 0; i < length; i += 1) out += charset[Math.floor(Math.random() * charset.length)];
    return out;
  }

  crackBtn.addEventListener("click", () => {
    clearInterval(timer);
    const target = targetPasswordInput.value.trim();
    if (!target || target.length > 10) {
      setResult(crackResultEl, "1-10 karakter parola gir.", false);
      return;
    }

    let attempts = 0;
    let secondsLeft = 60;
    let idx = 0;

    setResult(crackResultEl, "Simülasyon başladı...", null);
    setResult(strongSuggestionEl, "", null);

    timer = setInterval(() => {
      for (let i = 0; i < 5000; i += 1) {
        attempts += 1;
        let guess;
        if (idx < words.length) {
          strategyEl.textContent = "Sözlük";
          guess = words[idx];
          idx += 1;
        } else if (i % 2 === 0) {
          strategyEl.textContent = "Akıllı maske";
          guess = `${randomGuess(Math.max(1, target.length - 2))}${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`.slice(0, target.length);
        } else {
          strategyEl.textContent = "Tam brute force";
          guess = randomGuess(target.length);
        }
        attemptEl.textContent = guess;
        attemptCountEl.textContent = String(attempts);

        if (guess === target) {
          clearInterval(timer);
          setResult(crackResultEl, `Parola bulundu (${attempts} deneme).`, true);
          setResult(strongSuggestionEl, `Öneri: ${randomStrongPassword()}`, true);
          updateChain("password");
          setInstructor("Parola kırma hızını etkileyen ana faktör: uzunluk + karmaşıklık + MFA.");
          return;
        }
      }
      secondsLeft -= 1;
      timeLeftEl.textContent = String(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(timer);
        setResult(crackResultEl, "Süre doldu, parola bulunamadı.", true);
        setResult(strongSuggestionEl, `Güçlü parola önerisi: ${randomStrongPassword()}`, true);
        updateChain("password");
        setInstructor("Süre dolması, parola uzayı büyüdüğünde tahminin zorlaştığını gösterir.");
      }
    }, 1000);
  });
})();

(function phishingGame() {
  const mails = [
    { text: "Banka hesabınız kilitlendi! login-now.ru", answer: "phishing", reason: "Sahte URL + acil ton." },
    { text: "Toplantı linki kurumsal takvimde güncellendi.", answer: "safe", reason: "Normal iç iletişim." },
    { text: "Kargonuz için kart CVV girin: fast-fix.cc", answer: "phishing", reason: "Hassas veri talebi." },
    { text: "İK duyurusu: yıllık izin formu intranette.", answer: "safe", reason: "Yasal kurum içi akış." },
    { text: "Hesabınız kapanacak! password-reset.biz", answer: "phishing", reason: "Panik + sahte domain." },
  ];

  const mailBox = document.getElementById("mailBox");
  const feedbackEl = document.getElementById("mailFeedback");
  const scoreEl = document.getElementById("phishingScore");
  const answerButtons = document.querySelectorAll(".mail-answer");
  const nextMailBtn = document.getElementById("nextMailBtn");

  let current = mails[0];
  let score = 0;

  function pick() {
    current = mails[Math.floor(Math.random() * mails.length)];
    mailBox.textContent = current.text;
    setResult(feedbackEl, "", null);
  }

  answerButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const ok = btn.dataset.answer === current.answer;
      if (ok) score += 1;
      scoreEl.textContent = String(score);
      setResult(feedbackEl, ok ? `Doğru! ${current.reason}` : `Yanlış. ${current.reason}`, ok);
      if (score >= 3) {
        updateChain("phishing");
        setInstructor("Phishing tespitinde: domain, aciliyet dili, veri talebi üçlüsünü kontrol et.");
      }
    });
  });

  nextMailBtn.addEventListener("click", pick);
  pick();
})();

(function cryptoVault() {
  const plainInput = document.getElementById("plainInput");
  const cipherInput = document.getElementById("cipherInput");
  const encryptBtn = document.getElementById("encryptBtn");
  const decryptBtn = document.getElementById("decryptBtn");
  const copyCipherBtn = document.getElementById("copyCipherBtn");
  const cryptoFeedback = document.getElementById("cryptoFeedback");
  const decryptedText = document.getElementById("decryptedText");
  const secret = "CyberLab2026";

  function xorText(text) {
    let out = "";
    for (let i = 0; i < text.length; i += 1) {
      out += String.fromCharCode(text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
    }
    return out;
  }

  encryptBtn.addEventListener("click", () => {
    const plain = plainInput.value;
    if (!plain.trim()) return setResult(cryptoFeedback, "Metin gir.", false);
    cipherInput.value = btoa(unescape(encodeURIComponent(xorText(plain))));
    setResult(cryptoFeedback, "Şifrelendi.", true);
    updateChain("crypto");
    setInstructor("Toy algoritma eğitim içindir; gerçek hayatta kanıtlanmış kriptografi kullanılır.");
  });

  decryptBtn.addEventListener("click", () => {
    try {
      const solved = xorText(decodeURIComponent(escape(atob(cipherInput.value.trim()))));
      setResult(cryptoFeedback, "Çözüldü.", true);
      setResult(decryptedText, `Çözülmüş metin: ${solved}`, true);
    } catch {
      setResult(cryptoFeedback, "Geçersiz format.", false);
    }
  });

  copyCipherBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(cipherInput.value);
      setResult(cryptoFeedback, "Kopyalandı.", true);
    } catch {
      setResult(cryptoFeedback, "Kopyalanamadı.", false);
    }
  });
})();

(function osintLab() {
  const osintCaseEl = document.getElementById("osintCase");
  const osintToolOutput = document.getElementById("osintToolOutput");
  const osintQuestionsEl = document.getElementById("osintQuestions");
  const checkOsintBtn = document.getElementById("checkOsintBtn");
  const nextOsintBtn = document.getElementById("nextOsintBtn");
  const progressEl = document.getElementById("osintProgress");
  const feedbackEl = document.getElementById("osintFeedback");

  const cases = Array.from({ length: 10 }).map((_, i) => ({
    name: `Kişi-${i + 1}`,
    clues: [`LinkedIn: Rol-${i + 1}`, `Bio: Bölge-${i + 1}`],
    questions: [
      { q: "Rol ne?", options: [`Rol-${i + 1}`, "Rol-X", "Rol-Y"], a: `Rol-${i + 1}` },
      { q: "Bölge ne?", options: [`Bölge-${i + 1}`, "Bölge-A", "Bölge-B"], a: `Bölge-${i + 1}` },
    ],
    tools: {
      search: `Arama çıktısı: ${`Rol-${i + 1}`} bulundu.`,
      whois: `Whois çıktısı: kişi-${i + 1}.example kayıtlı.`,
      social: `Sosyal çıktısı: ${`Bölge-${i + 1}`} etiketi görüldü.`,
    },
  }));

  let index = 0;
  let completed = 0;

  function renderCase() {
    const c = cases[index];
    progressEl.textContent = `${index + 1}/10`;
    osintCaseEl.innerHTML = `<p><strong>Hedef:</strong> ${c.name}</p><ul>${c.clues.map((x) => `<li>${x}</li>`).join("")}</ul>`;
    osintQuestionsEl.innerHTML = c.questions
      .map(
        (q, qi) => `<div class="panel"><label>${qi + 1}. ${q.q}</label><select data-osint-q="${qi}"><option value="">Seç</option>${q.options
          .map((o) => `<option value="${o}">${o}</option>`)
          .join("")}</select></div>`
      )
      .join("");
  }

  document.getElementById("osintToolSearch").addEventListener("click", () => {
    osintToolOutput.textContent = cases[index].tools.search;
  });
  document.getElementById("osintToolWhois").addEventListener("click", () => {
    osintToolOutput.textContent = cases[index].tools.whois;
  });
  document.getElementById("osintToolSocial").addEventListener("click", () => {
    osintToolOutput.textContent = cases[index].tools.social;
  });

  checkOsintBtn.addEventListener("click", () => {
    const c = cases[index];
    let correct = 0;
    document.querySelectorAll("select[data-osint-q]").forEach((s, i) => {
      if (s.value === c.questions[i].a) correct += 1;
    });
    if (correct === c.questions.length) {
      completed += 1;
      setResult(feedbackEl, "Doğru. Sonraki kişiye geç.", true);
      if (completed >= 5) {
        updateChain("osint");
        setInstructor("OSINT'te çoklu kaynaktan doğrulama (cross-check) kritik yaklaşımdır.");
      }
    } else {
      setResult(feedbackEl, "Eksik/yanlış var. Tool kullanıp tekrar dene.", false);
    }
  });

  nextOsintBtn.addEventListener("click", () => {
    if (index < cases.length - 1) {
      index += 1;
      renderCase();
    } else {
      setResult(feedbackEl, "OSINT 10/10 tamamlandı.", true);
      updateChain("osint");
    }
  });

  renderCase();
})();

(function burpSimulation() {
  const targetSelect = document.getElementById("burpTarget");
  const introEl = document.getElementById("burpIntro");
  const outputEl = document.getElementById("burpOutput");
  const feedbackEl = document.getElementById("burpFeedback");
  const buttons = document.querySelectorAll(".burpStepBtn");

  const sites = [
    { name: "MiniBank", vuln: "default password", ok: "admin123" },
    { name: "ShopLite", vuln: "weak authz", ok: "id=2" },
    { name: "BlogEngine", vuln: "reflected input", ok: "search=test" },
    { name: "ForumX", vuln: "rate limit yok", ok: "login burst" },
  ];

  let step = 0;

  sites.forEach((s, i) => {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = s.name;
    targetSelect.appendChild(o);
  });

  function currentSite() {
    return sites[Number(targetSelect.value) || 0];
  }

  function resetScenario() {
    step = 0;
    const site = currentSite();
    introEl.innerHTML = `<p><strong>Hedef:</strong> ${site.name}</p><p><strong>Senaryo:</strong> ${site.vuln}</p><p>Burp amacı: HTTP istek/yanıt analizi.</p>`;
    outputEl.textContent = "1) Proxy ile isteği yakala.";
    setResult(feedbackEl, "", null);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = Number(btn.dataset.burpStep);
      if (s !== step + 1) return setResult(feedbackEl, "Adımları sırayla ilerlet.", false);
      step = s;
      const site = currentSite();
      if (step === 1) {
        outputEl.textContent = `[Proxy] GET /login?site=${site.name}`;
      } else if (step === 2) {
        outputEl.textContent = `[Repeater] Request cloned. Hedef zafiyet: ${site.vuln}`;
      } else {
        outputEl.textContent = `[Modified Request] payload=${site.ok}\n[Response] 200 OK`;
        setResult(feedbackEl, `Senaryo tamamlandı: ${site.name}`, true);
        updateChain("burp");
        setInstructor("Burp'te fark analizi: aynı endpointe farklı input gönderip yanıt değişimini incele.");
      }
    });
  });

  targetSelect.addEventListener("change", resetScenario);
  resetScenario();
})();

(function nmapSimulation() {
  const commandInput = document.getElementById("nmapCommand");
  const runBtn = document.getElementById("runNmapBtn");
  const outputEl = document.getElementById("nmapOutput");
  const meaningEl = document.getElementById("nmapMeaning");

  runBtn.addEventListener("click", () => {
    const cmd = commandInput.value.trim().replace(/\s+/g, " ");
    if (cmd === "nmap -sV 10.10.10.25") {
      outputEl.textContent = "22/ssh open\n80/http open\n3306/mysql open";
      setResult(meaningEl, "Servis versiyonları keşfedildi.", true);
      setInstructor("-sV servis parmak izi çıkarmaya yarar.");
      return;
    }
    if (cmd === "nmap -A 10.10.10.25") {
      outputEl.textContent = "OS: Linux 5.x\nHTTP title: MiniBank\nMethods: GET POST";
      setResult(meaningEl, "Detaylı keşif tamamlandı.", true);
      updateChain("nmap");
      setInstructor("-A agresif profil; OS/service/script bilgilerini genişletir.");
      return;
    }
    outputEl.textContent = "Öneri: nmap -sV 10.10.10.25 sonra nmap -A 10.10.10.25";
    setResult(meaningEl, "Komut formatını yönergeye göre gir.", false);
  });
})();
