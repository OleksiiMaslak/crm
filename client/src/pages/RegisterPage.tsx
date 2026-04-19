import { Alert, Button, Form, Input, Typography } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { clearError, register } from "../store/auth/auth.slice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import "../App.css";

type RegisterFormValues = {
  email: string;
  password: string;
};

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(
    () => () => {
      dispatch(clearError());
    },
    [dispatch],
  );

  const handleSubmit = (values: RegisterFormValues) => {
    void dispatch(register(values));
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-top-row">
          <div className="auth-logo">
            <div className="auth-logo-icon">🔗</div>
            <span className="auth-logo-text">github-crm</span>
          </div>
          <LanguageSwitcher />
        </div>

        <Typography.Title className="auth-title">
          {t("auth.register.title")}
        </Typography.Title>
        <p className="auth-subtitle">{t("auth.register.subtitle")}</p>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label={t("auth.emailLabel")}
            name="email"
            rules={[
              {
                required: true,
                type: "email",
                message: t("auth.validation.email"),
              },
            ]}
          >
            <Input
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              size="large"
              autoComplete="email"
            />
          </Form.Item>
          <Form.Item
            label={t("auth.passwordLabel")}
            name="password"
            rules={[
              {
                required: true,
                min: 8,
                message: t("auth.validation.passwordMin"),
              },
            ]}
          >
            <Input.Password
              placeholder={t("auth.passwordPlaceholder")}
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
              style={{ fontWeight: 600, letterSpacing: "0.2px" }}
            >
              {t("auth.register.submit")}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          {t("auth.register.footer")}{" "}
          <Link to="/login">{t("auth.register.footerLink")}</Link>
        </div>
      </div>
    </div>
  );
}
