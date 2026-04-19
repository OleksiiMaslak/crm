import { App as AntApp, ConfigProvider, theme } from "antd";
import enUS from "antd/locale/en_US";
import ukUA from "antd/locale/uk_UA";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute } from "./components/PrivateRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import "./App.css";

function App() {
  const { i18n } = useTranslation();
  const antdLocale = useMemo(
    () => (i18n.language.startsWith("uk") ? ukUA : enUS),
    [i18n.language],
  );

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#58a6ff",
          colorBgBase: "#0d1117",
          colorBgContainer: "#161b22",
          colorBgElevated: "#1c2128",
          colorBorder: "#30363d",
          colorText: "#e6edf3",
          colorTextSecondary: "#7d8590",
          colorError: "#f85149",
          colorSuccess: "#3fb950",
          colorWarning: "#d29922",
          fontFamily: "'Outfit', sans-serif",
          borderRadius: 8,
          fontSize: 14,
        },
        components: {
          Button: {
            colorPrimary: "#1f6feb",
            colorPrimaryHover: "#58a6ff",
            borderRadius: 8,
          },
          Input: {
            colorBgContainer: "#0d1117",
            colorBorder: "#30363d",
            colorText: "#e6edf3",
            colorTextPlaceholder: "#484f58",
            activeBorderColor: "#58a6ff",
          },
          Table: {
            colorBgContainer: "#161b22",
            headerBg: "#1c2128",
            rowHoverBg: "#1c2128",
            borderColor: "#30363d",
          },
          Card: {
            colorBgContainer: "#161b22",
            colorBorderSecondary: "#30363d",
          },
          Form: {
            labelColor: "#7d8590",
          },
          Alert: {
            colorErrorBg: "rgba(248,81,73,0.1)",
            colorErrorBorder: "rgba(248,81,73,0.4)",
          },
        },
      }}
    >
      <AntApp>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
