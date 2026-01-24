import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getAllBookings,
  getAllTestimonials,
  cancelBooking,
  toggleTestimonialVisibility,
  deleteTestimonial,
  verifyPassword,
  getUserById,
  updateUserPassword,
} from "@/lib/db";
import {
  getAllUsers as getAllUsersFromAPI,
  toggleTestimonialPermission as toggleTestimonialPermissionAPI,
  suspendUser as suspendUserAPI,
  unsuspendUser as unsuspendUserAPI,
  deleteUser as deleteUserAPI,
  resetUserPassword as resetUserPasswordAPI,
} from "@/lib/api";
import { User, Booking, Testimonial } from "@/lib/db";
import { Download, Trash2, X, Edit, Save, Lock, Eye, EyeOff, Ban, UserCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

const AdminDashboard = () => {
  const { user, isAuthenticated, isAdmin, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  // Password management
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // User password reset
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate("/dashboard");
      return;
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (isAdmin) {
        try {
          const [usersResponse, allBookings, allTestimonials] = await Promise.all([
            getAllUsersFromAPI(),
            getAllBookings(),
            getAllTestimonials(),
          ]);
          // Convert API response to User format
          const formattedUsers = usersResponse.users.map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            password: '', // API doesn't return password
            mobileNumber: u.mobileNumber,
            countryCode: u.countryCode,
            role: u.role,
            signupDate: u.signupDate,
            testimonialAllowed: u.testimonialAllowed,
            isSuspended: u.isSuspended,
          }));
          setUsers(formattedUsers);
          setBookings(allBookings);
          setTestimonials(allTestimonials);
        } catch (error) {
          console.error("Failed to load data:", error);
          toast({
            title: "Failed to load data",
            description: "An error occurred while loading dashboard data",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [isAdmin, toast]);

  const handleToggleTestimonialPermission = async (userId: number) => {
    try {
      await toggleTestimonialPermissionAPI(userId);
      // Reload users from API
      const usersResponse = await getAllUsersFromAPI();
      const formattedUsers = usersResponse.users.map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        password: '',
        mobileNumber: u.mobileNumber,
        countryCode: u.countryCode,
        role: u.role,
        signupDate: u.signupDate,
        testimonialAllowed: u.testimonialAllowed,
        isSuspended: u.isSuspended,
      }));
      setUsers(formattedUsers);
      toast({
        title: "Permission updated",
        description: "Testimonial permission has been updated",
      });
      // Refresh auth context if current user
      if (user && user.id === userId) {
        await refreshUser();
      }
    } catch (error) {
      toast({
        title: "Failed to update permission",
        description: "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (userId: number) => {
    try {
      await suspendUserAPI(userId);
      // Reload users from API
      const usersResponse = await getAllUsersFromAPI();
      const formattedUsers = usersResponse.users.map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        password: '',
        mobileNumber: u.mobileNumber,
        countryCode: u.countryCode,
        role: u.role,
        signupDate: u.signupDate,
        testimonialAllowed: u.testimonialAllowed,
        isSuspended: u.isSuspended,
      }));
      setUsers(formattedUsers);
      toast({
        title: "User suspended",
        description: "The user has been suspended successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to suspend user",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUnsuspendUser = async (userId: number) => {
    try {
      await unsuspendUserAPI(userId);
      // Reload users from API
      const usersResponse = await getAllUsersFromAPI();
      const formattedUsers = usersResponse.users.map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        password: '',
        mobileNumber: u.mobileNumber,
        countryCode: u.countryCode,
        role: u.role,
        signupDate: u.signupDate,
        testimonialAllowed: u.testimonialAllowed,
        isSuspended: u.isSuspended,
      }));
      setUsers(formattedUsers);
      toast({
        title: "User unsuspended",
        description: "The user has been unsuspended successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to unsuspend user",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        return;
      }
      await deleteUserAPI(userId);
      // Reload users from API
      const usersResponse = await getAllUsersFromAPI();
      const formattedUsers = usersResponse.users.map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        password: '',
        mobileNumber: u.mobileNumber,
        countryCode: u.countryCode,
        role: u.role,
        signupDate: u.signupDate,
        testimonialAllowed: u.testimonialAllowed,
        isSuspended: u.isSuspended,
      }));
      setUsers(formattedUsers);
      // Reload bookings and testimonials as they might have been deleted
      const [allBookings, allTestimonials] = await Promise.all([
        getAllBookings(),
        getAllTestimonials(),
      ]);
      setBookings(allBookings);
      setTestimonials(allTestimonials);
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete user",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await cancelBooking(bookingId);
      // Reload bookings
      const updatedBookings = await getAllBookings();
      setBookings(updatedBookings);
      toast({
        title: "Booking cancelled",
        description: "The booking has been cancelled successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to cancel booking",
        description: "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleToggleTestimonialVisibility = async (testimonialId: number) => {
    try {
      await toggleTestimonialVisibility(testimonialId);
      // Reload testimonials
      const updatedTestimonials = await getAllTestimonials();
      setTestimonials(updatedTestimonials);
      toast({
        title: "Testimonial updated",
        description: "Testimonial visibility has been toggled",
      });
    } catch (error) {
      toast({
        title: "Failed to update testimonial",
        description: "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestimonial = async (testimonialId: number) => {
    try {
      await deleteTestimonial(testimonialId);
      // Reload testimonials
      const updatedTestimonials = await getAllTestimonials();
      setTestimonials(updatedTestimonials);
      toast({
        title: "Testimonial deleted",
        description: "The testimonial has been removed",
      });
    } catch (error) {
      toast({
        title: "Failed to delete testimonial",
        description: "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      // Verify old password
      const dbUser = await getUserById(user.id);
      if (!dbUser) {
        throw new Error("User not found");
      }

      const isValid = await verifyPassword(oldPassword, dbUser.password);
      if (!isValid) {
        toast({
          title: "Invalid password",
          description: "Old password is incorrect",
          variant: "destructive",
        });
        return;
      }

      // Update password
      await updateUserPassword(user.id, newPassword);

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });

      // Reset form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId) return;

    if (resetPassword !== resetConfirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (resetPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      await resetUserPasswordAPI(resetUserId, resetPassword);
      toast({
        title: "Password reset",
        description: "User password has been reset successfully",
      });
      setResetUserId(null);
      setResetPassword("");
      setResetConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Failed to reset password",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const exportUsersToExcel = () => {
    const data = users.map((u) => ({
      Name: u.fullName,
      Email: u.email,
      "Signup Date": format(new Date(u.signupDate), "yyyy-MM-dd"),
      Role: u.role,
      Status: u.isSuspended ? "Suspended" : "Active",
      "Testimonial Allowed": u.testimonialAllowed ? "Yes" : "No",
      "Mobile Number": u.mobileNumber,
      "Country Code": u.countryCode,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `users_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast({
      title: "Export successful",
      description: "User data has been exported to Excel",
    });
  };

  const exportBookingsToExcel = () => {
    const data = bookings.map((b) => {
      const user = users.find((u) => u.id === b.userId);
      return {
        "Booking ID": b.id,
        "User Name": user?.fullName || "Unknown",
        "User Email": user?.email || "Unknown",
        "Trip Name": b.tripName,
        Status: b.status,
        "Booking Date": format(new Date(b.bookingDate), "yyyy-MM-dd"),
        "Trip Date": format(new Date(b.tripDate), "yyyy-MM-dd"),
        Details: b.details || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `bookings_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast({
      title: "Export successful",
      description: "Booking data has been exported to Excel",
    });
  };

  const exportTestimonialsToExcel = () => {
    const data = testimonials.map((t) => ({
      ID: t.id,
      "User Name": t.userName,
      Email: t.email,
      "Trip Name": t.tripName,
      Rating: t.rating,
      Quote: t.quote,
      Visible: t.isVisible ? "Yes" : "No",
      "Submitted Date": format(new Date(t.submittedDate), "yyyy-MM-dd"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Testimonials");
    XLSX.writeFile(wb, `testimonials_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast({
      title: "Export successful",
      description: "Testimonial data has been exported to Excel",
    });
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, bookings, and testimonials</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="bookings">Booking Management</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonial Control</TabsTrigger>
              <TabsTrigger value="password">Password Management</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">All Users</h2>
                <Button onClick={exportUsersToExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </div>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Signup Date</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Testimonial Allowed</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => {
                          const userBookings = bookings.filter((b) => b.userId === u.id);
                          return (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">{u.fullName}</TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>
                                {format(new Date(u.signupDate), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                  {u.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {u.isSuspended ? (
                                  <Badge variant="destructive">Suspended</Badge>
                                ) : (
                                  <Badge variant="default" className="bg-green-600">Active</Badge>
                                )}
                              </TableCell>
                              <TableCell>{userBookings.length}</TableCell>
                              <TableCell>
                                <Switch
                                  checked={u.testimonialAllowed}
                                  onCheckedChange={() =>
                                    handleToggleTestimonialPermission(u.id)
                                  }
                                  disabled={u.role === "admin"}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {u.role !== "admin" && (
                                    <>
                                      {u.isSuspended ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleUnsuspendUser(u.id)}
                                          className="text-green-600 hover:text-green-700"
                                        >
                                          <UserCheck className="h-4 w-4 mr-1" />
                                          Unsuspend
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleSuspendUser(u.id)}
                                          className="text-orange-600 hover:text-orange-700"
                                        >
                                          <Ban className="h-4 w-4 mr-1" />
                                          Suspend
                                        </Button>
                                      )}
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteUser(u.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setResetUserId(u.id)}
                                      >
                                        <Lock className="h-4 w-4 mr-1" />
                                        Reset Password
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reset Password for {u.fullName}</DialogTitle>
                                        <DialogDescription>
                                          Enter new password for this user. Old password is not
                                          required.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <form onSubmit={handleResetUserPassword}>
                                        <div className="space-y-4 py-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="resetPassword">New Password</Label>
                                            <Input
                                              id="resetPassword"
                                              type="password"
                                              value={resetPassword}
                                              onChange={(e) => setResetPassword(e.target.value)}
                                              required
                                              minLength={6}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="resetConfirmPassword">
                                              Confirm Password
                                            </Label>
                                            <Input
                                              id="resetConfirmPassword"
                                              type="password"
                                              value={resetConfirmPassword}
                                              onChange={(e) =>
                                                setResetConfirmPassword(e.target.value)
                                              }
                                              required
                                              minLength={6}
                                            />
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button type="submit">Reset Password</Button>
                                        </DialogFooter>
                                      </form>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">All Bookings</h2>
                <Button onClick={exportBookingsToExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </div>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Trip Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Booking Date</TableHead>
                          <TableHead>Trip Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => {
                          const bookingUser = users.find((u) => u.id === booking.userId);
                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{booking.id}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{bookingUser?.fullName || "Unknown"}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {bookingUser?.email || "Unknown"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{booking.tripName}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    booking.status === "confirmed"
                                      ? "default"
                                      : booking.status === "completed"
                                      ? "default"
                                      : booking.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                >
                                  {booking.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(booking.bookingDate), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                {format(new Date(booking.tripDate), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                {booking.status !== "cancelled" && booking.status !== "completed" && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelBooking(booking.id)}
                                  >
                                    Cancel Trip
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Testimonials Tab */}
            <TabsContent value="testimonials" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Testimonials</h2>
                <Button onClick={exportTestimonialsToExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </div>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Trip</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Quote</TableHead>
                          <TableHead>Visible</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testimonials.map((testimonial) => (
                          <TableRow key={testimonial.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{testimonial.userName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {testimonial.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{testimonial.tripName}</TableCell>
                            <TableCell>
                              {"★".repeat(testimonial.rating)}
                              {"☆".repeat(5 - testimonial.rating)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {testimonial.quote}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={testimonial.isVisible}
                                onCheckedChange={() =>
                                  handleToggleTestimonialVisibility(testimonial.id)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTestimonial(testimonial.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Password Management Tab */}
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Change Admin Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminOldPassword">Old Password</Label>
                      <Input
                        id="adminOldPassword"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminNewPassword">New Password</Label>
                      <Input
                        id="adminNewPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminConfirmPassword">Confirm Password</Label>
                      <Input
                        id="adminConfirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" disabled={changingPassword}>
                      <Save className="mr-2 h-4 w-4" />
                      {changingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
