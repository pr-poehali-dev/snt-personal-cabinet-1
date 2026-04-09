import { useState } from "react";
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

interface Payment {
  id: number;
  title: string;
  amount: string;
  date: string;
  status: "paid" | "pending" | "overdue";
}

const NOTIFICATIONS: Notification[] = [
  { id: 1, type: "charge", title: "Новое начисление: квартплата", amount: "4 850 ₽", date: "08 апр 2026", read: false },
  { id: 2, type: "payment", title: "Платёж принят: электроэнергия", amount: "1 230 ₽", date: "05 апр 2026", read: false },
  { id: 3, type: "charge", title: "Новое начисление: газ", amount: "720 ₽", date: "01 апр 2026", read: true },
  { id: 4, type: "payment", title: "Платёж принят: квартплата", amount: "4 850 ₽", date: "28 мар 2026", read: true },
];

const PAYMENTS: Payment[] = [
  { id: 1, title: "Квартплата", amount: "4 850 ₽", date: "08 апр 2026", status: "pending" },
  { id: 2, title: "Электроэнергия", amount: "1 230 ₽", date: "05 апр 2026", status: "paid" },
  { id: 3, title: "Газоснабжение", amount: "720 ₽", date: "01 апр 2026", status: "paid" },
  { id: 4, title: "Интернет", amount: "600 ₽", date: "28 мар 2026", status: "overdue" },
  { id: 5, title: "Квартплата", amount: "4 850 ₽", date: "28 мар 2026", status: "paid" },
];

export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifEmailAddr, setNotifEmailAddr] = useState("ivan@example.com");
  const [notifPhone, setNotifPhone] = useState("+7 (900) 123-45-67");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"payments" | "notifications" | "settings">("payments");

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function saveSettings() {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
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
          <div className="bg-white rounded-2xl border border-border p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={28} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">Иванов Иван Иванович</h2>
              <p className="text-muted-foreground text-base mt-0.5">Лицевой счёт: 123 456 789 · Кв. 47, ул. Ленина, 12</p>
            </div>
            {unreadCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <Icon name="Bell" size={18} className="text-red-600" />
                <span className="text-red-700 font-semibold text-base">{unreadCount} новых</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-secondary rounded-xl p-1">
            {(
              [
                { key: "payments", label: "Платежи", icon: "CreditCard" },
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

          {/* PAYMENTS TAB */}
          {activeTab === "payments" && (
            <div className="animate-slide-up">
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-border p-5">
                  <p className="text-muted-foreground text-sm mb-1">К оплате</p>
                  <p className="text-3xl font-bold text-amber-600">4 850 ₽</p>
                </div>
                <div className="bg-white rounded-2xl border border-border p-5">
                  <p className="text-muted-foreground text-sm mb-1">Оплачено за апрель</p>
                  <p className="text-3xl font-bold text-green-600">1 830 ₽</p>
                </div>
                <div className="bg-white rounded-2xl border border-border p-5">
                  <p className="text-muted-foreground text-sm mb-1">Просрочено</p>
                  <p className="text-3xl font-bold text-destructive">600 ₽</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">История платежей</h3>
                </div>
                <div className="divide-y divide-border">
                  {PAYMENTS.map((p) => (
                    <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                          <Icon name="Receipt" size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-base">{p.title}</p>
                          <p className="text-muted-foreground text-sm">{p.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-semibold text-foreground text-lg">{p.amount}</span>
                        <span
                          className={`text-sm font-medium px-3 py-1 rounded-lg border ${statusLabel[p.status].color}`}
                        >
                          {statusLabel[p.status].label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
