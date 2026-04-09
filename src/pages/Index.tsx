import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import Icon from "@/components/ui/icon";

type Page = "home" | "cabinet";

interface Notification {
  id: number;
  type: "charge" | "payment";
  title: string;
  amount: string;
  date: string;
  read: boolean;
}

const NOTIFICATIONS: Notification[] = [
  { id: 1, type: "charge", title: "Новое начисление: членские взносы", amount: "4 850 ₽", date: "08 апр 2026", read: false },
  { id: 2, type: "payment", title: "Платёж принят: электроэнергия", amount: "1 230 ₽", date: "05 апр 2026", read: false },
  { id: 3, type: "payment", title: "Платёж принят: членские взносы", amount: "4 850 ₽", date: "28 мар 2026", read: true },
];

interface Charge {
  id: number;
  period: string;
  amount: string;
  amountNum: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
}

interface Payment {
  id: number;
  title: string;
  amount: string;
  amountNum: number;
  date: string;
  status: "paid" | "pending" | "overdue";
}

const CHARGES_MEMBERSHIP: Charge[] = [
  { id: 1, period: "Май 2025", amount: "4 850 ₽", amountNum: 4850, dueDate: "20 май 2025", status: "paid" },
  { id: 2, period: "Май 2024", amount: "4 850 ₽", amountNum: 4850, dueDate: "20 май 2024", status: "paid" },
  { id: 3, period: "Май 2023", amount: "4 850 ₽", amountNum: 4850, dueDate: "20 май 2023", status: "paid" },
  { id: 4, period: "Май 2022", amount: "4 850 ₽", amountNum: 4850, dueDate: "20 май 2022", status: "paid" },
  { id: 5, period: "Май 2021", amount: "4 850 ₽", amountNum: 4850, dueDate: "20 май 2021", status: "paid" },
  { id: 6, period: "Май 2020", amount: "4 850 ₽", amountNum: 4850, dueDate: "20 май 2020", status: "paid" },
];

const CHARGES_ELECTRICITY: Charge[] = [
  { id: 1, period: "Апрель 2026", amount: "1 340 ₽", amountNum: 1340, dueDate: "25 апр 2026", status: "pending" },
  { id: 2, period: "Март 2026", amount: "1 230 ₽", amountNum: 1230, dueDate: "25 мар 2026", status: "paid" },
  { id: 3, period: "Февраль 2026", amount: "1 410 ₽", amountNum: 1410, dueDate: "25 фев 2026", status: "overdue" },
  { id: 4, period: "Январь 2026", amount: "1 580 ₽", amountNum: 1580, dueDate: "25 янв 2026", status: "paid" },
];

const PAYMENTS_MEMBERSHIP: Payment[] = [
  { id: 1, title: "Членские взносы", amount: "4 850 ₽", amountNum: 4850, date: "08 апр 2026", status: "pending" },
  { id: 2, title: "Членские взносы", amount: "4 850 ₽", amountNum: 4850, date: "28 мар 2026", status: "paid" },
];

const PAYMENTS_ELECTRICITY: Payment[] = [
  { id: 1, title: "Электроэнергия", amount: "1 230 ₽", amountNum: 1230, date: "05 апр 2026", status: "paid" },
];

export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifEmailAddr, setNotifEmailAddr] = useState("ivan@example.com");
  const [notifPhone, setNotifPhone] = useState("+7 (900) 123-45-67");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"membership" | "electricity" | "notifications" | "settings">("membership");
  const [membershipSubTab, setMembershipSubTab] = useState<"charges" | "payments" | "balance">("charges");
  const [electricitySubTab, setElectricitySubTab] = useState<"charges" | "payments" | "balance">("charges");
  const [paymentsMembership, setPaymentsMembership] = useState<Payment[]>(PAYMENTS_MEMBERSHIP);
  const [paymentsElectricity, setPaymentsElectricity] = useState<Payment[]>(PAYMENTS_ELECTRICITY);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function saveSettings() {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const newMembership: Payment[] = [];
        const newElectricity: Payment[] = [];
        let count = 0;

        rows.forEach((row, i) => {
          const keys = Object.keys(row).map((k) => k.toLowerCase().trim());
          const getVal = (names: string[]) => {
            const key = Object.keys(row).find((k) => names.includes(k.toLowerCase().trim()));
            return key ? String(row[key]).trim() : "";
          };

          const dateRaw = getVal(["дата", "date"]);
          const amountRaw = getVal(["сумма", "amount", "сумма оплаты"]);
          const service = getVal(["услуга", "service", "категория", "category"]).toLowerCase();

          const amountNum = parseFloat(String(amountRaw).replace(/[^\d.,]/g, "").replace(",", "."));
          if (!dateRaw || isNaN(amountNum)) return;

          const payment: Payment = {
            id: Date.now() + i,
            title: service.includes("электро") ? "Электроэнергия" : "Членские взносы",
            amount: `${amountNum.toLocaleString("ru-RU")} ₽`,
            amountNum,
            date: dateRaw,
            status: "paid",
          };

          if (service.includes("электро")) {
            newElectricity.push(payment);
          } else {
            newMembership.push(payment);
          }
          count++;
        });

        if (count === 0) {
          setImportStatus("error");
          setImportMessage("Не удалось распознать данные. Проверьте колонки: дата, сумма, участок, услуга.");
        } else {
          setPaymentsMembership((prev) => [...newMembership, ...prev]);
          setPaymentsElectricity((prev) => [...newElectricity, ...prev]);
          setImportStatus("success");
          setImportMessage(`Импортировано записей: ${count} (членские взносы: ${newMembership.length}, электроэнергия: ${newElectricity.length})`);
        }
        setTimeout(() => setImportStatus("idle"), 4000);
      } catch {
        setImportStatus("error");
        setImportMessage("Ошибка чтения файла. Убедитесь, что это файл Excel (.xlsx).");
        setTimeout(() => setImportStatus("idle"), 4000);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const statusLabel = {
    paid: { label: "Оплачено", color: "text-green-700 bg-green-50 border-green-200" },
    pending: { label: "Ожидает", color: "text-amber-700 bg-amber-50 border-amber-200" },
    overdue: { label: "Просрочено", color: "text-red-700 bg-red-50 border-red-200" },
  };

  return (
    <div className="min-h-screen bg-background font-golos">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Icon name="Home" size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">Мой Портал</span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setPage("home")}
              className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                page === "home"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              Главная
            </button>
            <button
              onClick={() => setPage("cabinet")}
              className={`px-4 py-2 rounded-lg text-base font-medium transition-colors relative ${
                page === "cabinet"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              Кабинет
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* HOME PAGE */}
      {page === "home" && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">
          {/* Hero */}
          <div className="mb-14">
            <p className="text-primary font-medium text-lg mb-3">Добро пожаловать</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-5">
              Управляйте платежами<br />просто и удобно
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed max-w-xl">
              Следите за начислениями, получайте уведомления об оплате и контролируйте все платежи в одном месте.
            </p>
            <button
              onClick={() => setPage("cabinet")}
              className="mt-8 bg-primary text-primary-foreground text-lg font-semibold px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Войти в личный кабинет
            </button>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {[
              {
                icon: "Bell",
                title: "Уведомления",
                desc: "Получайте оповещения о новых начислениях на email или SMS",
              },
              {
                icon: "CreditCard",
                title: "История платежей",
                desc: "Все платежи и начисления в одной таблице — всегда под рукой",
              },
              {
                icon: "ShieldCheck",
                title: "Безопасность",
                desc: "Ваши данные надёжно защищены и доступны только вам",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-border p-6 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <Icon name={f.icon} size={22} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Info block */}
          <div className="bg-white rounded-2xl border border-border p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
              <Icon name="PhoneCall" size={28} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Нужна помощь?</h3>
              <p className="text-muted-foreground text-base">
                Звоните нам по телефону{" "}
                <span className="font-semibold text-foreground">8 800 100-00-00</span> (бесплатно) или пишите на{" "}
                <span className="font-semibold text-foreground">help@portal.ru</span>
              </p>
            </div>
          </div>
        </main>
      )}

      {/* CABINET PAGE */}
      {page === "cabinet" && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
          {/* User card */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={28} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">Иванов Иван Иванович</h2>
              <p className="text-muted-foreground text-base mt-0.5">Лицевой счёт: 123 456 789 · Кв. 47, ул. Ленина, 12</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {unreadCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex items-center gap-2">
                  <Icon name="Bell" size={18} className="text-red-600" />
                  <span className="text-red-700 font-semibold text-base">{unreadCount} новых</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-base font-medium hover:bg-primary/90 transition-colors"
              >
                <Icon name="Upload" size={18} />
                Импорт оплат
              </button>
            </div>
          </div>

          {/* Import status */}
          {importStatus !== "idle" && (
            <div className={`mb-4 px-5 py-3 rounded-xl flex items-center gap-3 text-base font-medium ${
              importStatus === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              <Icon name={importStatus === "success" ? "CheckCircle" : "AlertCircle"} size={18} />
              {importMessage}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-secondary rounded-xl p-1">
            {(
              [
                { key: "membership", label: "Членские взносы", icon: "Users" },
                { key: "electricity", label: "Электроэнергия", icon: "Zap" },
                { key: "notifications", label: "Уведомления", icon: "Bell" },
                { key: "settings", label: "Настройки", icon: "Settings" },
              ] as { key: typeof activeTab; label: string; icon: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon name={tab.icon} size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.key === "notifications" && unreadCount > 0 && (
                  <span className="bg-destructive text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* MEMBERSHIP TAB */}
          {activeTab === "membership" && (() => {
            const totalCharged = CHARGES_MEMBERSHIP.reduce((s, c) => s + c.amountNum, 0);
            const totalPaid = paymentsMembership.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountNum, 0);
            const diff = totalPaid - totalCharged;
            return (
              <div className="animate-slide-up">
                <div className="flex gap-2 mb-5 bg-secondary rounded-xl p-1 w-fit">
                  <button
                    onClick={() => setMembershipSubTab("charges")}
                    className={`px-5 py-2 rounded-lg text-base font-medium transition-colors ${
                      membershipSubTab === "charges" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Начисления
                  </button>
                  <button
                    onClick={() => setMembershipSubTab("payments")}
                    className={`px-5 py-2 rounded-lg text-base font-medium transition-colors ${
                      membershipSubTab === "payments" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Оплаты
                  </button>
                  <button
                    onClick={() => setMembershipSubTab("balance")}
                    className={`px-5 py-2 rounded-lg text-base font-medium transition-colors ${
                      membershipSubTab === "balance" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Долг / Переплата
                  </button>
                </div>

                {membershipSubTab === "charges" && (
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                        <Icon name="FileText" size={18} className="text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Начисления — Членские взносы</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {CHARGES_MEMBERSHIP.map((c) => (
                        <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground text-base">{c.period}</p>
                            <p className="text-muted-foreground text-sm">Срок оплаты: {c.dueDate}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-semibold text-foreground text-lg">{c.amount}</span>
                            <span className={`text-sm font-medium px-3 py-1 rounded-lg border ${statusLabel[c.status].color}`}>
                              {statusLabel[c.status].label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {membershipSubTab === "payments" && (
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                        <Icon name="CreditCard" size={18} className="text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Оплаты — Членские взносы</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {paymentsMembership.map((p) => (
                        <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground text-base">{p.title}</p>
                            <p className="text-muted-foreground text-sm">{p.date}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-semibold text-foreground text-lg">{p.amount}</span>
                            <span className={`text-sm font-medium px-3 py-1 rounded-lg border ${statusLabel[p.status].color}`}>
                              {statusLabel[p.status].label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {membershipSubTab === "balance" && (
                  <div className="bg-white rounded-2xl border border-border p-8">
                    <div className="grid sm:grid-cols-2 gap-4 mb-8">
                      <div className="bg-secondary rounded-xl p-5">
                        <p className="text-muted-foreground text-sm mb-1">Всего начислено</p>
                        <p className="text-2xl font-bold text-foreground">{totalCharged.toLocaleString("ru-RU")} ₽</p>
                      </div>
                      <div className="bg-secondary rounded-xl p-5">
                        <p className="text-muted-foreground text-sm mb-1">Всего оплачено</p>
                        <p className="text-2xl font-bold text-foreground">{totalPaid.toLocaleString("ru-RU")} ₽</p>
                      </div>
                    </div>
                    <div className={`rounded-2xl border p-8 flex items-center gap-6 ${diff < 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${diff < 0 ? "bg-red-100" : "bg-green-100"}`}>
                        <Icon name={diff < 0 ? "AlertCircle" : "CheckCircle"} size={28} className={diff < 0 ? "text-red-600" : "text-green-600"} />
                      </div>
                      <div>
                        <p className={`text-lg font-semibold mb-1 ${diff < 0 ? "text-red-700" : "text-green-700"}`}>
                          {diff < 0 ? "Долг" : "Переплата"}
                        </p>
                        <p className={`text-4xl font-bold ${diff < 0 ? "text-red-600" : "text-green-600"}`}>
                          {Math.abs(diff).toLocaleString("ru-RU")} ₽
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ELECTRICITY TAB */}
          {activeTab === "electricity" && (() => {
            const totalCharged = CHARGES_ELECTRICITY.reduce((s, c) => s + c.amountNum, 0);
            const totalPaid = paymentsElectricity.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountNum, 0);
            const diff = totalPaid - totalCharged;
            return (
              <div className="animate-slide-up">
                <div className="flex gap-2 mb-5 bg-secondary rounded-xl p-1 w-fit">
                  <button
                    onClick={() => setElectricitySubTab("charges")}
                    className={`px-5 py-2 rounded-lg text-base font-medium transition-colors ${
                      electricitySubTab === "charges" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Начисления
                  </button>
                  <button
                    onClick={() => setElectricitySubTab("payments")}
                    className={`px-5 py-2 rounded-lg text-base font-medium transition-colors ${
                      electricitySubTab === "payments" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Оплаты
                  </button>
                  <button
                    onClick={() => setElectricitySubTab("balance")}
                    className={`px-5 py-2 rounded-lg text-base font-medium transition-colors ${
                      electricitySubTab === "balance" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Долг / Переплата
                  </button>
                </div>

                {electricitySubTab === "charges" && (
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                        <Icon name="FileText" size={18} className="text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Начисления — Электроэнергия</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {CHARGES_ELECTRICITY.map((c) => (
                        <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground text-base">{c.period}</p>
                            <p className="text-muted-foreground text-sm">Срок оплаты: {c.dueDate}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-semibold text-foreground text-lg">{c.amount}</span>
                            <span className={`text-sm font-medium px-3 py-1 rounded-lg border ${statusLabel[c.status].color}`}>
                              {statusLabel[c.status].label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {electricitySubTab === "payments" && (
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                        <Icon name="CreditCard" size={18} className="text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Оплаты — Электроэнергия</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {paymentsElectricity.map((p) => (
                        <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground text-base">{p.title}</p>
                            <p className="text-muted-foreground text-sm">{p.date}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-semibold text-foreground text-lg">{p.amount}</span>
                            <span className={`text-sm font-medium px-3 py-1 rounded-lg border ${statusLabel[p.status].color}`}>
                              {statusLabel[p.status].label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {electricitySubTab === "balance" && (
                  <div className="bg-white rounded-2xl border border-border p-8">
                    <div className="grid sm:grid-cols-2 gap-4 mb-8">
                      <div className="bg-secondary rounded-xl p-5">
                        <p className="text-muted-foreground text-sm mb-1">Всего начислено</p>
                        <p className="text-2xl font-bold text-foreground">{totalCharged.toLocaleString("ru-RU")} ₽</p>
                      </div>
                      <div className="bg-secondary rounded-xl p-5">
                        <p className="text-muted-foreground text-sm mb-1">Всего оплачено</p>
                        <p className="text-2xl font-bold text-foreground">{totalPaid.toLocaleString("ru-RU")} ₽</p>
                      </div>
                    </div>
                    <div className={`rounded-2xl border p-8 flex items-center gap-6 ${diff < 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${diff < 0 ? "bg-red-100" : "bg-green-100"}`}>
                        <Icon name={diff < 0 ? "AlertCircle" : "CheckCircle"} size={28} className={diff < 0 ? "text-red-600" : "text-green-600"} />
                      </div>
                      <div>
                        <p className={`text-lg font-semibold mb-1 ${diff < 0 ? "text-red-700" : "text-green-700"}`}>
                          {diff < 0 ? "Долг" : "Переплата"}
                        </p>
                        <p className={`text-4xl font-bold ${diff < 0 ? "text-red-600" : "text-green-600"}`}>
                          {Math.abs(diff).toLocaleString("ru-RU")} ₽
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="animate-slide-up">
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Уведомления</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-primary text-base font-medium hover:underline"
                    >
                      Отметить все прочитанными
                    </button>
                  )}
                </div>
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-6 py-4 flex items-start gap-4 ${!n.read ? "bg-accent/40" : ""}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          n.type === "charge" ? "bg-amber-50" : "bg-green-50"
                        }`}
                      >
                        <Icon
                          name={n.type === "charge" ? "TrendingUp" : "CheckCircle"}
                          size={18}
                          className={n.type === "charge" ? "text-amber-600" : "text-green-600"}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-base ${!n.read ? "font-semibold" : "font-medium"} text-foreground`}>
                            {n.title}
                          </p>
                          {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">{n.date}</p>
                      </div>
                      <span className="font-semibold text-foreground text-base whitespace-nowrap">{n.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="animate-slide-up space-y-4">
              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-5">
                  Уведомления о начислениях и платежах
                </h3>

                {/* Email toggle */}
                <div className="flex items-start gap-4 py-4 border-b border-border">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <Icon name="Mail" size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">Электронная почта</p>
                        <p className="text-sm text-muted-foreground">Уведомления будут приходить на email</p>
                      </div>
                      <button
                        onClick={() => setNotifEmail(!notifEmail)}
                        className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                          notifEmail ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            notifEmail ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    {notifEmail && (
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">
                          Адрес электронной почты
                        </label>
                        <input
                          type="email"
                          value={notifEmailAddr}
                          onChange={(e) => setNotifEmailAddr(e.target.value)}
                          className="w-full border border-border rounded-xl px-4 py-3 text-base text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SMS toggle */}
                <div className="flex items-start gap-4 py-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <Icon name="MessageSquare" size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">SMS-уведомления</p>
                        <p className="text-sm text-muted-foreground">Уведомления на мобильный телефон</p>
                      </div>
                      <button
                        onClick={() => setNotifSms(!notifSms)}
                        className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                          notifSms ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            notifSms ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    {notifSms && (
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Номер телефона</label>
                        <input
                          type="tel"
                          value={notifPhone}
                          onChange={(e) => setNotifPhone(e.target.value)}
                          className="w-full border border-border rounded-xl px-4 py-3 text-base text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="w-full bg-primary text-primary-foreground text-lg font-semibold py-4 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {settingsSaved ? (
                  <>
                    <Icon name="CheckCircle" size={20} />
                    Настройки сохранены
                  </>
                ) : (
                  "Сохранить настройки"
                )}
              </button>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground text-sm">
          <span>© 2026 Мой Портал. Все права защищены.</span>
          <span>8 800 100-00-00 · help@portal.ru</span>
        </div>
      </footer>
    </div>
  );
}