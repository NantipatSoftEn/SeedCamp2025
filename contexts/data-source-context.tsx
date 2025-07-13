"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

type DataSource = "mock" | "supabase";

interface DataSourceContextType {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  isDevelopment: boolean;
  isClient: boolean;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(
  undefined
);

export function DataSourceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataSource, setDataSource] = useState<DataSource>("supabase");
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);

    // Check if we're in development mode
    const devMode =
      process.env.NEXT_PUBLIC_NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    console.log("Development mode:", devMode);
    setIsDevelopment(devMode);

    // Load saved preference from localStorage
    try {
      const savedSource = localStorage.getItem("dataSource") as DataSource;
      if (
        savedSource &&
        (savedSource === "mock" || savedSource === "supabase")
      ) {
        setDataSource(savedSource);
      } else {
        // Default to mock in development, supabase in production
        setDataSource(devMode ? "mock" : "supabase");
      }
    } catch (error) {
      console.warn("Could not access localStorage:", error);
      setDataSource(devMode ? "mock" : "supabase");
    }
  }, []);

  const handleSetDataSource = (source: DataSource) => {
    setDataSource(source);
    try {
      localStorage.setItem("dataSource", source);
    } catch (error) {
      console.warn("Could not save to localStorage:", error);
    }
  };

  return (
    <DataSourceContext.Provider
      value={{
        dataSource,
        setDataSource: handleSetDataSource,
        isDevelopment,
        isClient,
      }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (context === undefined) {
    throw new Error("useDataSource must be used within a DataSourceProvider");
  }
  return context;
}
