// APPLICATION ____________________________
// │   ├── application/
// │   │   └── use-cases/
// │   │       ├── CreateProductUseCase.ts
// │   │       ├── CreateOrderUseCase.ts
// │   │       └── AuthenticateUserUseCase.ts
//

import { Order } from "../../domain/entities/Order";
import { OrderItem } from "../../domain/entities/OrderItem";
import { OrderRepository } from "../../domain/repository-interfaces/OrderRepository";
import { ProductRepository } from "../../domain/repository-interfaces/ProductRepository";

export class CreateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository
  ) {}

  async execute(
    customerId: string,
    items: { productId: string; quantity: number }[]
  ): Promise<Order> {
    const order = new Order(Date.now().toString(), customerId);

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(`Producto ${item.productId} no encontrado`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para el producto ${product.name}`);
      }

      product.decreaseStock(item.quantity);
      await this.productRepository.save(product);

      order.addItem(new OrderItem(product.id, item.quantity, product.price));
    }

    await this.orderRepository.save(order);

    return order;
  }
}

// src/application/use-cases/AuthenticateUserUseCase.ts
import { UserRepository } from "../../domain/repository-interfaces/UserRepository";
import { AuthenticationService } from "../../domain/services/AuthenticationService";

export class AuthenticateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthenticationService
  ) {}

  async execute(email: string, password: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return this.authService.authenticate(email, password);
  }
}
