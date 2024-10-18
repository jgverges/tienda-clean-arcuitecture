// src/infrastructure/api/api.ts
// │   ├── infrastructure/
// │   │   ├── api/
// │   │   │   └── api.ts
// │   │   ├── repositories/
// │   │   │   ├── ApiProductRepository.ts
// │   │   │   ├── ApiOrderRepository.ts
// │   │   │   └── ApiUserRepository.ts
// │   │   └── services/
// │   │       └── JwtAuthenticationService.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000",
});

// Interceptor para añadir el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// src/infrastructure/repositories/ApiProductRepository.ts
import { Product } from "../../domain/entities/Product";
import { ProductRepository } from "../../domain/repository-interfaces/ProductRepository";
import { api } from "../api/api";

export class ApiProductRepository implements ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const response = await api.get(`/products/${id}`);
    if (response.data) {
      return new Product(
        response.data.id,
        response.data.name,
        response.data.price,
        response.data.stock
      );
    }
    return null;
  }

  async save(product: Product): Promise<void> {
    await api.put(`/products/${product.id}`, product);
  }

  async findAll(): Promise<Product[]> {
    const response = await api.get("/products");
    return response.data.map(
      (item: any) => new Product(item.id, item.name, item.price, item.stock)
    );
  }
}

// src/infrastructure/repositories/ApiOrderRepository.ts
import { Order } from "../../domain/entities/Order";
import { OrderRepository } from "../../domain/repository-interfaces/OrderRepository";
import { api } from "../api/api";

export class ApiOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    const response = await api.get(`/orders/${id}`);
    if (response.data) {
      const order = new Order(
        response.data.id,
        response.data.customerId,
        response.data.status
      );
      order.items = response.data.items;
      order.totalAmount = response.data.totalAmount;
      return order;
    }
    return null;
  }

  async save(order: Order): Promise<void> {
    await api.put(`/orders/${order.id}`, order);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const response = await api.get(`/customers/${customerId}/orders`);
    return response.data.map((item: any) => {
      const order = new Order(item.id, item.customerId, item.status);
      order.items = item.items;
      order.totalAmount = item.totalAmount;
      return order;
    });
  }
}

// src/infrastructure/repositories/ApiUserRepository.ts
import { User } from "../../domain/entities/User";
import { UserRepository } from "../../domain/repository-interfaces/UserRepository";
import { api } from "../api/api";

export class ApiUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const response = await api.get(`/users?email=${email}`);
    if (response.data.length > 0) {
      const userData = response.data[0];
      return new User(
        userData.id,
        userData.email,
        userData.name,
        userData.role
      );
    }
    return null;
  }

  async save(user: User): Promise<void> {
    await api.post("/users", user);
  }
}

// src/infrastructure/services/JwtAuthenticationService.ts
import { User } from "../../domain/entities/User";
import { AuthenticationService } from "../../domain/services/AuthenticationService";
import { api } from "../api/api";

export class JwtAuthenticationService implements AuthenticationService {
  async authenticate(email: string, password: string): Promise<string> {
    const response = await api.post("/login", { email, password });
    return response.data.token;
  }

  async validateToken(token: string): Promise<User> {
    const response = await api.get("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return new User(
      response.data.id,
      response.data.email,
      response.data.name,
      response.data.role
    );
  }
}
