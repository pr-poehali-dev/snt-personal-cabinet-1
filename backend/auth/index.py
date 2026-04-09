"""
Авторизация пользователей: вход, установка пароля, сброс пароля.
POST /login — вход по логину и паролю
POST /set-password — установка пароля при первом входе
POST /reset-password — сброс пароля до '1111' (после 3 неудачных попыток)
"""
import json
import os
import hashlib
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def md5(s: str) -> str:
    return hashlib.md5(s.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == "login":
            login = str(body.get("login", "")).strip().lower()
            password = str(body.get("password", ""))

            cur.execute(
                "SELECT id, role, is_first_login, failed_attempts, password_hash FROM users WHERE login = %s",
                (login,)
            )
            row = cur.fetchone()

            if not row:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Пользователь не найден"})}

            user_id, role, is_first_login, failed_attempts, stored_hash = row

            if failed_attempts >= 3:
                return {"statusCode": 403, "headers": headers, "body": json.dumps({
                    "error": "Превышено число попыток",
                    "show_reset": True
                })}

            if md5(password) != stored_hash:
                cur.execute("UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = %s", (user_id,))
                conn.commit()
                new_attempts = failed_attempts + 1
                return {"statusCode": 401, "headers": headers, "body": json.dumps({
                    "error": f"Неверный пароль. Попыток осталось: {3 - new_attempts}",
                    "show_reset": new_attempts >= 3
                })}

            cur.execute("UPDATE users SET failed_attempts = 0 WHERE id = %s", (user_id,))
            conn.commit()

            return {"statusCode": 200, "headers": headers, "body": json.dumps({
                "user_id": user_id,
                "login": login,
                "role": role,
                "is_first_login": is_first_login,
                "plot": login if role == "user" else None
            })}

        elif action == "set_password":
            user_id = body.get("user_id")
            new_password = str(body.get("password", ""))
            if len(new_password) < 4:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Пароль должен быть не менее 4 символов"})}

            cur.execute(
                "UPDATE users SET password_hash = %s, is_first_login = false, failed_attempts = 0 WHERE id = %s",
                (md5(new_password), user_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        elif action == "reset_password":
            login = str(body.get("login", "")).strip().lower()
            cur.execute(
                "UPDATE users SET password_hash = %s, is_first_login = true, failed_attempts = 0 WHERE login = %s",
                (md5("1111"), login)
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True, "message": "Пароль сброшен до '1111'"})}

        else:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Неизвестное действие"})}

    finally:
        cur.close()
        conn.close()
