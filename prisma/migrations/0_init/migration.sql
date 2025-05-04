-- 1) Crear el enum OrderStatus solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'orderstatus'
  ) THEN
    CREATE TYPE "OrderStatus" AS ENUM (
      'PENDING',
      'PAID',
      'DELIVERED',
      'CANCELLED'
    );
  END IF;
END
$$;

-- 2) Crear la tabla "Order" si no existe
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "stripeChargeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- 3) Crear la tabla "OrderReceipt" si no existe
CREATE TABLE IF NOT EXISTS "OrderReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "receiptUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- 4) Crear la tabla "OrderItem" si no existe
CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT
);

-- 5) Crear índice único en OrderReceipt.orderId si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'orderreceipt_orderid_key'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX "OrderReceipt_orderId_key"
      ON "OrderReceipt" ("orderId");
  END IF;
END
$$;

-- 6) Añadir clave foránea en OrderReceipt.orderId si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'OrderReceipt_orderId_fkey'
      AND tc.table_name = 'OrderReceipt'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE "OrderReceipt"
      ADD CONSTRAINT "OrderReceipt_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END
$$;

-- 7) Añadir clave foránea en OrderItem.orderId si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'OrderItem_orderId_fkey'
      AND tc.table_name = 'OrderItem'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE "OrderItem"
      ADD CONSTRAINT "OrderItem_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;