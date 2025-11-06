import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Package, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, TABLES, handleError } from "@/lib/supabase";

interface ProductVariant {
  size?: string;
  price: number;
  id?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  cost: number;
  sku?: string;
  barcode?: string;
  variants: ProductVariant[];
  in_stock: boolean;
  stock_quantity: number;
  low_stock_threshold?: number;
  image_url?: string;
  purchase_date?: string | null; // ISO date string
  expiry_date?: string | null; // ISO date string
  created_at?: string;
  updated_at?: string;
  category_id?: string;
}

type ProductFormData = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

const defaultProduct: ProductFormData = {
  name: '',
  description: '',
  category: '',
  price: 0,
  cost: 0,
  sku: '',
  barcode: '',
  variants: [],
  in_stock: true,
  stock_quantity: 0,
  low_stock_threshold: 10,
  image_url: '',
  purchase_date: '',
  expiry_date: '',
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentProduct, setCurrentProduct] = useState<ProductFormData>({...defaultProduct});
  const [batchPriceByProduct, setBatchPriceByProduct] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Function to generate a SKU from product name and category
  const generateSKU = (name: string, category: string): string => {
    // Take first 3 letters of category (or all if less than 3)
    const categoryPart = category.slice(0, 3).toUpperCase();
    
    // Take first 3 letters of product name (or all if less than 3)
    const namePart = name
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      .slice(0, 3)
      .toUpperCase();
    
    // Add a random 4-digit number
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    
    return `${categoryPart}${namePart}${randomPart}`;
  };
  
  // Function to check if SKU exists
  const skuExists = async (sku: string, excludeId?: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku);
      
    if (error) {
      console.error('Error checking SKU:', error);
      return false;
    }
    
    // If we're updating a product, exclude its own ID from the check
    if (excludeId) {
      return data.some(product => product.id !== excludeId);
    }
    
    return data.length > 0;
  };

  // Fetch products from Supabase
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      setLoading(true);
      
      // Log the Supabase config for debugging
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      
      const { data, error, status } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .order('name');

      console.log('Supabase response:', { data, error, status });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      // Helper: get a signed URL for any form of image reference
      const signFromAny = async (value?: string | null): Promise<string> => {
        if (!value) return '';

        // If it's an absolute HTTP(S) URL, try to extract a storage path and sign it
        if (value.startsWith('http://') || value.startsWith('https://')) {
          try {
            // Examples we handle:
            // - .../storage/v1/object/public/product-images/products/file.jpg
            // - .../storage/v1/object/product-images/products/file.jpg (rare)
            const url = new URL(value);
            const path = url.pathname; // e.g. /storage/v1/object/public/product-images/products/file.jpg

            const publicPrefix = '/storage/v1/object/public/product-images/';
            const anyPrefix = '/storage/v1/object/product-images/';

            let storagePath = '';
            if (path.includes(publicPrefix)) {
              storagePath = path.substring(path.indexOf(publicPrefix) + publicPrefix.length);
            } else if (path.includes(anyPrefix)) {
              storagePath = path.substring(path.indexOf(anyPrefix) + anyPrefix.length);
            }

            if (storagePath) {
              const { data: signed, error: signedErr } = await supabase.storage
                .from('product-images')
                .createSignedUrl(storagePath, 60 * 60);
              if (!signedErr && signed?.signedUrl) return signed.signedUrl;
            }
          } catch {
            // Fall through to using original value
          }
          return value; // non-supabase or failed extraction
        }

        // Otherwise treat as a storage path like products/file.jpg
        try {
          const { data: signed, error: signedErr } = await supabase.storage
            .from('product-images')
            .createSignedUrl(value, 60 * 60);
          if (!signedErr && signed?.signedUrl) return signed.signedUrl;
        } catch {}

        // Fallback to public URL (works if bucket is public)
        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(value);
        return pub.publicUrl;
      };

      const resolved = await Promise.all((data || []).map(async (p) => ({
        ...p,
        image_url: await signFromAny(p.image_url)
      })));

      setProducts(resolved);

      // Load oldest batch prices per product for effective display price
      try {
        const { data: batches, error: bErr } = await supabase
          .from('stock_batches')
          .select('product_id, price, quantity_remaining, created_at')
          .gt('quantity_remaining', 0)
          .order('created_at');
        if (!bErr) {
          const map: Record<string, number> = {};
          (batches || []).forEach((b: any) => {
            if (map[b.product_id] === undefined) {
              map[b.product_id] = Number(b.price) || 0;
            }
          });
          setBatchPriceByProduct(map);
        }
      } catch (e) {
        console.warn('Failed to load batch prices', e);
      }
      console.log('Products loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      toast.error('Failed to fetch products. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const price = parseFloat(formData.get("price") as string);
      const cost = parseFloat(formData.get("cost") as string);
      const description = (formData.get("description") as string) || '';
      const stockQuantity = parseInt(formData.get("stock_quantity") as string) || 0;
      const sku = (formData.get('sku') as string) || null;
      const barcode = (formData.get('barcode') as string) || null;
      const purchaseDate = (formData.get('purchase_date') as string) || null;
      const expiryDate = (formData.get('expiry_date') as string) || null;
      const imageFile = (formData.get("image") as File) || null;

      // Resolve category (dropdown or custom)
      const categoryName = selectedCategory === '__custom__'
        ? (customCategory || 'Uncategorized')
        : (selectedCategory || currentProduct.category || 'Uncategorized');

      // Ensure category exists and get its id
      let categoryId: string | null = null;
      const { data: existingCategory, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (existingCategory) {
        categoryId = (existingCategory as any).id;
      } else {
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert([{ name: categoryName }])
          .select('id')
          .single();
        if (createError) throw createError;
        categoryId = (newCategory as any)?.id || null;
      }

      // Optionally upload a new image if provided
      let imageUrl = currentProduct.image_url || '';
      if (imageFile && imageFile.size > 0) {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validImageTypes.includes(imageFile.type)) {
          throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
        }
        const maxSize = 5 * 1024 * 1024;
        if (imageFile.size > maxSize) {
          throw new Error('Image size should be less than 5MB');
        }
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: imageFile.type || 'image/jpeg',
            duplex: 'half'
          });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      if (isEditing && currentProductId) {
        const { error } = await supabase
          .from(TABLES.PRODUCTS)
          .update({
            name,
            description,
            category_id: categoryId,
            price,
            cost,
            sku,
            barcode,
            stock_quantity: stockQuantity,
            in_stock: stockQuantity > 0,
            low_stock_threshold: currentProduct.low_stock_threshold ?? 10,
            image_url: imageUrl,
            purchase_date: purchaseDate,
            expiry_date: expiryDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentProductId);
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase
          .from(TABLES.PRODUCTS)
          .insert([{ 
            name,
            description,
            category_id: categoryId,
            price,
            cost,
            sku,
            barcode,
            stock_quantity: stockQuantity,
            in_stock: stockQuantity > 0,
            low_stock_threshold: 10,
            image_url: imageUrl,
            purchase_date: purchaseDate,
            expiry_date: expiryDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();
        if (error) throw error;
        toast.success('Product created successfully');
      }

      resetForm();
      fetchProducts();
      setIsDialogOpen(false);
    } catch (error) {
      handleError(error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} product`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price,
      cost: product.cost,
      sku: product.sku || '',
      barcode: product.barcode || '',
      variants: product.variants || [],
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity || 0,
      low_stock_threshold: product.low_stock_threshold || 10,
      image_url: product.image_url || '',
      purchase_date: product.purchase_date || '',
      expiry_date: product.expiry_date || '',
    });
    setImagePreview(product.image_url || null);
    setCurrentProductId(product.id);
    // Seed category selector with existing category
    setSelectedCategory(product.category || "");
    setCustomCategory("");
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // First, get the product to check for an image
        const { data: product, error: fetchError } = await supabase
          .from(TABLES.PRODUCTS)
          .select('image_url')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        // If the product has an image, delete it from storage
        if (product?.image_url) {
          try {
            // Extract the file path from the URL
            const url = new URL(product.image_url);
            const pathParts = url.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const filePath = `products/${fileName}`;

            try {
              // First check if the bucket exists
              const { data: bucket, error: bucketError } = await supabase.storage.getBucket('product-images');
              
              if (!bucketError) {
                // Bucket exists, try to delete the file
                const { error: storageError } = await supabase.storage
                  .from('product-images')
                  .remove([filePath]);

                if (storageError && !storageError.message.includes('not found')) {
                  console.warn('Could not delete image from storage:', storageError);
                }
              }
            } catch (error) {
              console.warn('Error during image deletion:', error);
              // Continue with product deletion even if image deletion fails
            }
          } catch (error) {
            console.warn('Error processing image URL:', error);
            // Continue with product deletion even if URL processing fails
          }
        }

        // Delete any variants associated with this product
        const { error: variantError } = await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', id);

        if (variantError) throw variantError;

        // Finally, delete the product
        const { error: deleteError } = await supabase
          .from(TABLES.PRODUCTS)
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        
        // Update the UI
        setProducts(products.filter(product => product.id !== id));
        toast.success('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        handleError(error);
        toast.error('Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setCurrentProduct({...defaultProduct});
    setCurrentProductId(null);
    setIsEditing(false);
    setImagePreview(null);
  };

  const handleAddVariant = () => {
    setCurrentProduct(prev => ({
      ...prev,
      variants: [...prev.variants, { size: '', price: 0, id: crypto.randomUUID() }]
    }));
  };

  const removeVariant = (index: number) => {
    setCurrentProduct(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
    const newVariants = [...currentProduct.variants];
    const variantId = newVariants[index]?.id || crypto.randomUUID();
    newVariants[index] = { 
      ...newVariants[index], 
      id: variantId,
      [field]: field === 'price' ? Number(value) : value 
    };
    setCurrentProduct({ ...currentProduct, variants: newVariants });
  };

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query)) ||
      (product.sku && product.sku.toLowerCase().includes(query)) ||
      (product.barcode && product.barcode.toLowerCase().includes(query))
    );
  });

  const resolveImageUrl = (imagePath?: string | null): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Treat stored value as a storage path like "products/filename.jpg"
    const { data } = supabase.storage.from('product-images').getPublicUrl(imagePath);
    return data.publicUrl || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const toInputDate = (value?: string | null) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
    };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const cost = parseFloat(formData.get("cost") as string);
    const description = formData.get("description") as string || '';
    const stockQuantity = parseInt(formData.get("stock_quantity") as string) || 0;
    const categoryName = selectedCategory === '__custom__'
      ? (customCategory || 'Uncategorized')
      : (selectedCategory || 'Uncategorized');
    const sku = formData.get('sku') as string || null;
    const barcode = formData.get('barcode') as string || null;
    const imageFile = (formData.get("image") as File) || null;
    const purchaseDate = formData.get('purchase_date') as string || null;
    const expiryDate = formData.get('expiry_date') as string || null;

    if (name && price && cost) {
      try {
        setIsSubmitting(true);
        
        // First, try to get the category if it exists
        let categoryId = null;
        
        // Check if category exists
        const { data: existingCategory, error: fetchError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', categoryName)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw fetchError;
        }

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Create new category if it doesn't exist
          const { data: newCategory, error: createError } = await supabase
            .from('categories')
            .insert([{ name: categoryName }])
            .select('id')
            .single();

          if (createError) throw createError;
          categoryId = newCategory?.id || null;
        }

        // Handle image upload if exists
        let imageUrl = '';
        if (imageFile && imageFile.size > 0) {
          try {
            // Validate file type
            const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!validImageTypes.includes(imageFile.type)) {
              throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
            }
            
            // Check file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (imageFile.size > maxSize) {
              throw new Error('Image size should be less than 5MB');
            }
            
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;
            
            try {
              // First, try to upload the file directly
              const { data, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, imageFile, {
                  cacheControl: '3600',
                  upsert: false,
                  contentType: imageFile.type || 'image/jpeg',
                  duplex: 'half'
                });
                
              if (uploadError) {
                if (uploadError.message.includes('bucket not found') || uploadError.message.includes('Bucket not found')) {
                  // If bucket doesn't exist, show user-friendly message
                  console.warn('Storage bucket not found. Please create a bucket named "product-images" in your Supabase Storage.');
                  toast.warning('Storage not configured. Please create a bucket named "product-images" in your Supabase Storage.');
                  return;
                }
                console.error('Upload error:', uploadError);
                throw uploadError;
              }
              
              // Get the public URL
              const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);
                
              imageUrl = publicUrl;
              
            } catch (error) {
              console.error('Error in image upload process:', error);
              throw new Error('Failed to upload image. Please try again.');
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            // Continue without image if upload fails
            toast.warning('Product added, but there was an issue uploading the image.');
          }
        }
        
        // Generate SKU if not provided
        let finalSku = sku;
        if (!finalSku) {
          // Generate a unique SKU
          let newSku = '';
          let attempts = 0;
          const maxAttempts = 5;
          
          while (attempts < maxAttempts) {
            newSku = generateSKU(name, categoryName);
            const exists = await skuExists(newSku);
            if (!exists) {
              finalSku = newSku;
              break;
            }
            attempts++;
          }
          
          if (!finalSku) {
            // If we couldn't generate a unique SKU after max attempts, use a timestamp
            finalSku = `SKU-${Date.now().toString().slice(-8)}`;
          }
        }
        
        // Create the product with all fields
        const { data, error } = await supabase
          .from('products')
          .insert([
            { 
              name,
              description,
              category_id: categoryId,
              price,
              cost,
              sku: finalSku,
              barcode,
              stock_quantity: stockQuantity,
              in_stock: stockQuantity > 0,
              low_stock_threshold: 10,
              image_url: imageUrl,
              purchase_date: purchaseDate,
              expiry_date: expiryDate,
            }
          ])
          .select()
          .single();

        if (error) throw error;

        // Add any variants if needed
        if (currentProduct.variants.length > 0) {
          const variantsWithProductId = currentProduct.variants.map(variant => ({
            ...variant,
            product_id: data.id,
            created_at: new Date().toISOString()
          }));

          const { error: variantError } = await supabase
            .from('product_variants')
            .insert(variantsWithProductId);

          if (variantError) throw variantError;
        }

        // If initial stock provided, create initial FIFO stock batch
        try {
          if (stockQuantity > 0 && data?.id) {
            await supabase.from('stock_batches').insert([{
              product_id: data.id,
              quantity_remaining: stockQuantity,
              cost: cost,
              price: price,
            }]);
          }
        } catch (e) {
          console.warn('Failed to create initial stock batch:', e);
        }

        // Refresh the products list
        await fetchProducts();
        
        // Reset form and close dialog
        setCurrentProduct({...defaultProduct});
        setIsDialogOpen(false);
        toast.success("Product added successfully");
        
        // Safely reset the form if the target exists
        if (e?.currentTarget?.reset) {
          e.currentTarget.reset();
        }
      } catch (error) {
        console.error('Error adding product:', error);
        toast.error('Failed to add product. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your menu and product variants</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-dark">
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Update the product details below.' : 'Fill in the details to add a new product.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => (isEditing ? handleSubmit(e) : handleAddProduct(e))} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" required defaultValue={isEditing ? currentProduct.name : ''} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU (Leave empty to auto-generate)</Label>
                  <Input 
                    id="sku" 
                    name="sku" 
                    placeholder="Will be auto-generated if empty" 
                    defaultValue={isEditing ? currentProduct.sku : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" name="barcode" placeholder="123456789012" defaultValue={isEditing ? (currentProduct.barcode || '') : ''} />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Product description"
                  className="min-h-[100px]"
                  defaultValue={isEditing ? (currentProduct.description || '') : ''}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Selling Price (₱)</Label>
                  <Input id="price" name="price" type="number" step="0.01" required defaultValue={isEditing ? currentProduct.price : undefined} />
                </div>
                <div>
                  <Label htmlFor="cost">Cost Price (₱)</Label>
                  <Input id="cost" name="cost" type="number" step="0.01" required defaultValue={isEditing ? currentProduct.cost : undefined} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input id="purchase_date" name="purchase_date" type="date" defaultValue={isEditing ? toInputDate(currentProduct.purchase_date) : ''} />
                </div>
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input id="expiry_date" name="expiry_date" type="date" defaultValue={isEditing ? toInputDate(currentProduct.expiry_date) : ''} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input 
                    id="stock_quantity" 
                    name="stock_quantity" 
                    type="number" 
                    min="0" 
                    defaultValue={isEditing ? currentProduct.stock_quantity : 0} 
                    required 
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">+ Add new category</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedCategory === '__custom__' && (
                    <div className="mt-2">
                      <Input
                        id="category"
                        name="category"
                        placeholder="Enter new category name"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="image">Product Image</Label>
                <div className="mt-2 flex flex-col space-y-4">
                  {/* Image Preview */}
                  {(imagePreview || currentProduct.image_url) && (
                    <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                      <img 
                        src={imagePreview || currentProduct.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* File Input */}
                  <div className="flex items-center">
                    <label
                      htmlFor="image"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-primary-dark focus-within:outline-none border border-input px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span>Choose File</span>
                      <Input 
                        id="image" 
                        name="image" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            setImagePreview(null);
                          }
                        }}
                      />
                    </label>
                    <p className="pl-2 text-sm text-muted-foreground">
                      {imagePreview ? 'Change image' : 'No file chosen'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, WebP (Max 5MB)
                  </p>
                </div>
              </div>
              
              <Button type="submit" className="w-full mt-4">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isSubmitting
                  ? (isEditing ? 'Saving...' : 'Adding...')
                  : (isEditing ? 'Save Changes' : 'Add Product')}
              </Button>
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
            className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              {resolveImageUrl(product.image_url) ? (
                <img 
                  src={resolveImageUrl(product.image_url) || ''} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <Package className="w-12 h-12 text-primary/50" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-foreground">{product.name}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {product.category}
                  </Badge>
                </div>

                <div className="space-y-3 mt-4">
                  {(product.sku || product.barcode) && (
                    <div className="pb-3 mb-3 border-b border-border">
                      {product.sku && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">SKU</span>
                          <span className="font-medium text-foreground">{product.sku}</span>
                        </div>
                      )}
                      {product.barcode && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Barcode</span>
                          <span className="font-mono text-sm text-foreground">{product.barcode}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold text-primary">
                      ₱{(batchPriceByProduct[product.id] ?? product.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-medium text-foreground">₱{product.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">In Stock</span>
                    <span className={`font-medium ${product.stock_quantity > 0 ? 'text-success' : 'text-destructive'}`}>
                      {product.stock_quantity} units
                    </span>
                  </div>
                  {(product.purchase_date || product.expiry_date) && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {product.purchase_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Purchased</span>
                          <span className="font-medium text-foreground">{new Date(product.purchase_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {product.expiry_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expiry</span>
                          <span className="font-medium text-foreground">{new Date(product.expiry_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profit Margin</span>
                    <span className="font-medium text-success">
                      {product.price > 0 ? (((product.price - product.cost) / product.price) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>

                {product.variants?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Variants:</p>
                    <div className="space-y-1">
                      {(product.variants || []).map((variant, idx) => (
                        <div key={variant.id || idx} className="flex justify-between text-sm">
                          <span className="text-foreground">{variant.size || "Default"}</span>
                          <span className="font-medium text-primary">₱{variant.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(product)}
                  className="flex-1 mr-2"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(product.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
