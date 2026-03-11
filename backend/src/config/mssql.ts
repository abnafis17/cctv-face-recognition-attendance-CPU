import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const mssqlConfig: sql.config = {
  user: process.env.ERP_DB_USER,
  password: process.env.ERP_DB_PASSWORD,
  server: process.env.ERP_DB_HOST as string,
  port: Number(process.env.ERP_DB_PORT),
  database: process.env.ERP_DB_NAME,
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === "true",
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export const getMssqlPool = async (): Promise<sql.ConnectionPool> => {
  if (pool?.connected) return pool;

  pool = await new sql.ConnectionPool(mssqlConfig).connect();
  console.log("✅ MSSQL connected");
  return pool;
};

export { sql };
