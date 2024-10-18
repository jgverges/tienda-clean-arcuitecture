// PRESENTATION ___________________________
// │   ├── presentation/
// │   │   ├── components/
// │   │   │   ├── Header.tsx
// │   │   │   ├── ProductList.tsx
// │   │   │   ├── CreateProductForm.tsx
// │   │   │   ├── CreateOrderForm.tsx
// │   │   │   ├── OrderList.tsx
// │   │   │   └── LoginForm.tsx
// │   │   ├── pages/
// │   │   │   ├── HomePage.tsx
// │   │   │   ├── ProductPage.tsx
// │   │   │   ├── OrderPage.tsx
// │   │   │   └── LoginPage.tsx
// │   │   ├── hooks/
// │   │   │   ├── useProducts.ts
// │   │   │   ├── useOrders.ts
// │   │   │   └── useAuth.ts
// │   │   └── stores/
// │   │       └── authStore.ts

// Stores___

// src/presentation/stores/authStore.ts
import create from "zustand";
import { User } from "../../domain/entities/User";

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),
}));

// hooks---
// src/presentation/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiProductRepository } from "../../infrastructure/repositories/ApiProductRepository";
import { CreateProductUseCase } from "../../application/use-cases/CreateProductUseCase";

const productRepository = new ApiProductRepository();
const createProductUseCase = new CreateProductUseCase(productRepository);

export const useProducts = () => {
  const queryClient = useQueryClient();

  const productsQuery = useQuery(["products"], () =>
    productRepository.findAll()
  );

  const createProductMutation = useMutation(
    (data: { name: string; price: number; stock: number }) =>
      createProductUseCase.execute(data.name, data.price, data.stock),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["products"]);
      },
    }
  );

  return {
    products: productsQuery.data,
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    createProduct: createProductMutation.mutate,
    isCreating: createProductMutation.isLoading,
  };
};

// src/presentation/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiOrderRepository } from "../../infrastructure/repositories/ApiOrderRepository";
import { CreateOrderUseCase } from "../../application/use-cases/CreateOrderUseCase";
import { ApiProductRepository } from "../../infrastructure/repositories/ApiProductRepository";
import { useAuthStore } from "../stores/authStore";

const orderRepository = new ApiOrderRepository();
const productRepository = new ApiProductRepository();
const createOrderUseCase = new CreateOrderUseCase(
  orderRepository,
  productRepository
);

export const useOrders = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const ordersQuery = useQuery(
    ["orders", user?.id],
    () => orderRepository.findByCustomerId(user!.id),
    {
      enabled: !!user,
    }
  );

  const createOrderMutation = useMutation(
    (data: { productId: string; quantity: number }) =>
      createOrderUseCase.execute(user!.id, [data]),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["orders", user?.id]);
      },
    }
  );

  return {
    orders: ordersQuery.data,
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    createOrder: createOrderMutation.mutate,
    isCreating: createOrderMutation.isLoading,
  };
};
// src/presentation/hooks/useAuth.ts
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { AuthenticateUserUseCase } from "../../application/use-cases/AuthenticateUserUseCase";
import { ApiUserRepository } from "../../infrastructure/repositories/ApiUserRepository";
import { JwtAuthenticationService } from "../../infrastructure/services/JwtAuthenticationService";

const userRepository = new ApiUserRepository();
const authService = new JwtAuthenticationService();
const authenticateUserUseCase = new AuthenticateUserUseCase(
  userRepository,
  authService
);

export const useAuth = () => {
  const { setUser, setToken } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authenticateUserUseCase.execute(credentials.email, credentials.password),
    onSuccess: async (token) => {
      setToken(token);
      const user = await authService.validateToken(token);
      setUser(user);
    },
  });

  return { login: loginMutation.mutate, isLoading: loginMutation.isLoading };
};

// compoenents___

// src/presentation/components/Header.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-blue-500 p-4">
      <nav className="flex justify-between items-center">
        <div>
          <Link to="/" className="text-white mr-4">
            Home
          </Link>
          <Link to="/products" className="text-white mr-4">
            Products
          </Link>
          <Link to="/orders" className="text-white mr-4">
            Orders
          </Link>
        </div>
        <div>
          {user ? (
            <>
              <span className="text-white mr-4">Welcome, {user.name}</span>
              <button onClick={logout} className="text-white">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-white">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

// src/presentation/components/ProductList.tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiProductRepository } from "../../infrastructure/repositories/ApiProductRepository";

const productRepository = new ApiProductRepository();

export const ProductList: React.FC = () => {
  const {
    data: products,
    isLoading,
    error,
  } = useQuery(["products"], () => productRepository.findAll());

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error has occurred: {error.message}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="border p-4 rounded">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <p>Price: ${product.price}</p>
          <p>Stock: {product.stock}</p>
        </div>
      ))}
    </div>
  );
};

// src/presentation/components/CreateProductForm.tsx
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateProductUseCase } from "../../application/use-cases/CreateProductUseCase";
import { ApiProductRepository } from "../../infrastructure/repositories/ApiProductRepository";

const productRepository = new ApiProductRepository();
const createProductUseCase = new CreateProductUseCase(productRepository);

export const CreateProductForm: React.FC = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    (data: { name: string; price: number; stock: number }) =>
      createProductUseCase.execute(data.name, data.price, data.stock),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["products"]);
      },
    }
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    mutation.mutate({
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block">
          Name:
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label htmlFor="price" className="block">
          Price:
        </label>
        <input
          type="number"
          id="price"
          name="price"
          step="0.01"
          required
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label htmlFor="stock" className="block">
          Stock:
        </label>
        <input
          type="number"
          id="stock"
          name="stock"
          required
          className="border p-2 w-full"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create Product
      </button>
    </form>
  );
};

// src/presentation/components/CreateOrderForm.tsx
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateOrderUseCase } from "../../application/use-cases/CreateOrderUseCase";
import { ApiOrderRepository } from "../../infrastructure/repositories/ApiOrderRepository";
import { ApiProductRepository } from "../../infrastructure/repositories/ApiProductRepository";
import { useAuthStore } from "../stores/authStore";

const orderRepository = new ApiOrderRepository();
const productRepository = new ApiProductRepository();
const createOrderUseCase = new CreateOrderUseCase(
  orderRepository,
  productRepository
);

export const CreateOrderForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const mutation = useMutation(
    (data: { productId: string; quantity: number }) =>
      createOrderUseCase.execute(user!.id, [data]),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["orders"]);
      },
    }
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    mutation.mutate({
      productId: formData.get("productId") as string,
      quantity: Number(formData.get("quantity")),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="productId" className="block">
          Product ID:
        </label>
        <input
          type="text"
          id="productId"
          name="productId"
          required
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label htmlFor="quantity" className="block">
          Quantity:
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          required
          className="border p-2 w-full"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create Order
      </button>
    </form>
  );
};

// src/presentation/components/OrderList.tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiOrderRepository } from "../../infrastructure/repositories/ApiOrderRepository";
import { useAuthStore } from "../stores/authStore";

const orderRepository = new ApiOrderRepository();

export const OrderList: React.FC = () => {
  const { user } = useAuthStore();
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery(["orders", user?.id], () =>
    orderRepository.findByCustomerId(user!.id)
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error has occurred: {error.message}</div>;

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border p-4 rounded">
          <h3 className="text-lg font-bold">Order ID: {order.id}</h3>
          <p>Status: {order.status}</p>
          <p>Total Amount: ${order.totalAmount}</p>
          <h4 className="font-bold mt-2">Items:</h4>
          <ul>
            {order.items.map((item, index) => (
              <li key={index}>
                Product ID: {item.productId}, Quantity: {item.quantity}, Price:
                ${item.price}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

// src/presentation/components/LoginForm.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login({ email, password });
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block">
          Email:
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label htmlFor="password" className="block">
          Password:
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="border p-2 w-full"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

//___ PAGES___

// src/presentation/pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";

export const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to Our E-commerce Store
      </h1>
      <p className="mb-4">
        Explore our wide range of products and great deals!
      </p>
      <Link to="/products" className="bg-blue-500 text-white px-4 py-2 rounded">
        Shop Now
      </Link>
    </div>
  );
};

// src/presentation/pages/ProductPage.tsx
import React from "react";
import { ProductList } from "../components/ProductList";
import { CreateProductForm } from "../components/CreateProductForm";
import { useAuthStore } from "../stores/authStore";

export const ProductPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Products</h1>
      <ProductList />
      {user && user.role === "admin" && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
          <CreateProductForm />
        </div>
      )}
    </div>
  );
};

// src/presentation/pages/OrderPage.tsx
import React from "react";
import { CreateOrderForm } from "../components/CreateOrderForm";
import { OrderList } from "../components/OrderList";

export const OrderPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Orders</h1>
      <CreateOrderForm />
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Your Orders</h2>
        <OrderList />
      </div>
    </div>
  );
};

// src/presentation/pages/LoginPage.tsx
import React from "react";
import { LoginForm } from "../components/LoginForm";

export const LoginPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <LoginForm />
    </div>
  );
};

// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { HomePage } from "./presentation/pages/HomePage";
import { ProductPage } from "./presentation/pages/ProductPage";
import { OrderPage } from "./presentation/pages/OrderPage";
import { LoginPage } from "./presentation/pages/LoginPage";
import { Header } from "./presentation/components/Header";

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
