// DOMAIN________________________________________
// │   │   ├── entities/
// │   │   │   ├── Product.ts
// │   │   │   ├── Order.ts
// │   │   │   ├── User.ts
// │   │   │   └── OrderItem.ts
// │   │   ├── value-objects/
// │   │   │   ├── ProductId.ts
// │   │   │   ├── Money.ts
// │   │   │   ├── Email.ts
// │   │   │   └── Password.ts
// │   │   ├── repository-interfaces/
// │   │   │   ├── ProductRepository.ts
// │   │   │   ├── OrderRepository.ts
// │   │   │   └── UserRepository.ts
// │   │   └── services/
// │   │       └── AuthenticationService.ts

// ENTITIES

// src/domain/entities/Product.ts
export class Product {
  constructor(
    public id: string,
    public name: string,
    public price: number,
    public stock: number
  ) {}

  decreaseStock(quantity: number): void {
    if (quantity > this.stock) {
      throw new Error("Stock insuficiente");
    }
    this.stock -= quantity;
  }

  increaseStock(quantity: number): void {
    this.stock += quantity;
  }
}

// src/domain/entities/Order.ts
import { OrderItem } from "./OrderItem";

export class Order {
  public items: OrderItem[] = [];
  public totalAmount: number = 0;

  constructor(
    public id: string,
    public customerId: string,
    public status:
      | "pending"
      | "processing"
      | "completed"
      | "cancelled" = "pending"
  ) {}

  addItem(item: OrderItem): void {
    this.items.push(item);
    this.recalculateTotal();
  }

  removeItem(productId: string): void {
    this.items = this.items.filter((item) => item.productId !== productId);
    this.recalculateTotal();
  }

  private recalculateTotal(): void {
    this.totalAmount = this.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );
  }

  process(): void {
    if (this.status !== "pending") {
      throw new Error("La orden no está en estado pendiente");
    }
    this.status = "processing";
  }

  complete(): void {
    if (this.status !== "processing") {
      throw new Error("La orden no está en estado de procesamiento");
    }
    this.status = "completed";
  }

  cancel(): void {
    if (this.status === "completed") {
      throw new Error("No se puede cancelar una orden completada");
    }
    this.status = "cancelled";
  }
}

// src/domain/entities/OrderItem.ts
export class OrderItem {
  constructor(
    public productId: string,
    public quantity: number,
    public price: number
  ) {}
}

// src/domain/entities/User.ts
export class User {
  constructor(
    public id: string,
    public email: string,
    public name: string,
    public role: "customer" | "admin"
  ) {}
}

//
//
// ___INTERFACES___
//
// src/domain/repository-interfaces/ProductRepository.ts
import { Product } from "../entities/Product";

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  findAll(): Promise<Product[]>;
}

// src/domain/repository-interfaces/OrderRepository.ts
import { Order } from "../entities/Order";

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  findByCustomerId(customerId: string): Promise<Order[]>;
}

// src/domain/repository-interfaces/UserRepository.ts
import { User } from "../entities/User";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// SERVICES

// src/domain/services/AuthenticationService.ts
import { User } from "../entities/User";

export interface AuthenticationService {
  authenticate(email: string, password: string): Promise<string>; // Returns JWT
  validateToken(token: string): Promise<User>;
}
