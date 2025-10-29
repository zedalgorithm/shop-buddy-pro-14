import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  variants: { size?: string; price: number }[];
  inStock: boolean;
}

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Classic Burger",
    category: "Main",
    price: 15,
    cost: 8,
    variants: [
      { size: "Regular", price: 15 },
      { size: "Large", price: 18 },
    ],
    inStock: true,
  },
  {
    id: "2",
    name: "Chicken Wrap",
    category: "Main",
    price: 12,
    cost: 6,
    variants: [{ price: 12 }],
    inStock: true,
  },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const cost = parseFloat(formData.get("cost") as string);

    if (name && price && cost) {
      const newProduct: Product = {
        id: Date.now().toString(),
        name,
        category: "Main",
        price,
        cost,
        variants: [{ price }],
        inStock: true,
      };
      setProducts([...products, newProduct]);
      setIsDialogOpen(false);
      toast.success("Product added successfully");
      e.currentTarget.reset();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your menu and product variants</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-dark">
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="price">Selling Price</Label>
                <Input id="price" name="price" type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="cost">Cost Price</Label>
                <Input id="cost" name="cost" type="number" step="0.01" required />
              </div>
              <Button type="submit" className="w-full">Add Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-border shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <Button size="icon" variant="ghost">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2">{product.name}</h3>
              <Badge variant="secondary" className="mb-4">
                {product.category}
              </Badge>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Price</span>
                  <span className="font-semibold text-primary">${product.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-medium text-foreground">${product.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className="font-medium text-success">
                    {(((product.price - product.cost) / product.price) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {product.variants.length > 1 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Variants:</p>
                  <div className="space-y-1">
                    {product.variants.map((variant, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-foreground">{variant.size || "Default"}</span>
                        <span className="font-medium text-primary">${variant.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
