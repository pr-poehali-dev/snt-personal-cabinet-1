"""
Данные для личного кабинета пользователя и администратора.
GET /?plot=1 — начисления и оплаты по участку
GET /?all=1 — все участки с суммами (только для админа)
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    params = event.get("queryStringParameters") or {}
    plot = params.get("plot")
    get_all = params.get("all")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if get_all:
            # Все участки: суммы начислений и оплат
            cur.execute("""
                SELECT
                    u.login AS plot,
                    COALESCE(SUM(c.amount) FILTER (WHERE c.service ILIKE '%взнос%' OR c.service ILIKE '%членск%'), 0) AS charged_membership,
                    COALESCE(SUM(c.amount) FILTER (WHERE c.service ILIKE '%электро%'), 0) AS charged_electricity,
                    COALESCE(SUM(p.amount) FILTER (WHERE p.service ILIKE '%взнос%' OR p.service ILIKE '%членск%'), 0) AS paid_membership,
                    COALESCE(SUM(p.amount) FILTER (WHERE p.service ILIKE '%электро%'), 0) AS paid_electricity
                FROM users u
                LEFT JOIN charges c ON c.plot = u.login
                LEFT JOIN payments p ON p.plot = u.login
                WHERE u.role = 'user'
                GROUP BY u.login
                ORDER BY u.login
            """)
            rows = cur.fetchall()
            result = []
            for row in rows:
                plot_id, cm, ce, pm, pe = row
                result.append({
                    "plot": plot_id,
                    "charged_membership": float(cm),
                    "charged_electricity": float(ce),
                    "paid_membership": float(pm),
                    "paid_electricity": float(pe),
                    "balance_membership": float(pm) - float(cm),
                    "balance_electricity": float(pe) - float(ce),
                })
            return {"statusCode": 200, "headers": headers, "body": json.dumps(result, ensure_ascii=False)}

        elif plot:
            # Начисления по участку
            cur.execute("""
                SELECT id, service, period, amount, due_date
                FROM charges WHERE plot = %s ORDER BY due_date DESC
            """, (plot,))
            charges = [
                {"id": r[0], "service": r[1], "period": r[2], "amount": float(r[3]), "due_date": str(r[4]) if r[4] else ""}
                for r in cur.fetchall()
            ]

            # Оплаты по участку
            cur.execute("""
                SELECT id, service, amount, payment_date
                FROM payments WHERE plot = %s ORDER BY payment_date DESC
            """, (plot,))
            payments = [
                {"id": r[0], "service": r[1], "amount": float(r[2]), "date": str(r[3])}
                for r in cur.fetchall()
            ]

            return {"statusCode": 200, "headers": headers, "body": json.dumps({
                "charges": charges,
                "payments": payments
            }, ensure_ascii=False)}

        else:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажите plot или all"})}

    finally:
        cur.close()
        conn.close()
