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
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUserBookings, createBooking, updateUserPassword, verifyPassword, getUserById } from "@/lib/db";
import { Booking } from "@/lib/db";
import { Calendar, MapPin, Clock, User, Mail, Phone, Lock, Save } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");

  // Password change form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Redirect if not authenticated or if admin user
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    // Admin users should not access user dashboard - redirect to admin panel
    if (user && user.role === 'admin') {
      navigate("/admin");
      return;
    }
  }, [isAuthenticated, navigate, user]);

  // Load bookings
  useEffect(() => {
    async function loadBookings() {
      if (user) {
        try {
          const userBookings = await getUserBookings(user.id);
          setBookings(userBookings);
        } catch (error) {
          console.error("Failed to load bookings:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadBookings();
  }, [user]);

  const upcomingTrips = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  );
  const pastTrips = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled"
  );

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your bookings and account</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="account">Account Information</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              {/* Upcoming Trips */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Upcoming Trips</h2>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : upcomingTrips.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No upcoming trips</p>
                      <Button className="mt-4" onClick={() => navigate("/destinations")}>
                        Browse Destinations
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingTrips.map((booking) => (
                      <Card key={booking.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{booking.tripName}</CardTitle>
                            <Badge
                              variant={
                                booking.status === "confirmed"
                                  ? "default"
                                  : booking.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(booking.tripDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              Booked: {format(new Date(booking.bookingDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                          {booking.details && (
                            <p className="text-sm text-muted-foreground">{booking.details}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Trips */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Past Trips</h2>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : pastTrips.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No past trips</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pastTrips.map((booking) => (
                      <Card key={booking.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{booking.tripName}</CardTitle>
                            <Badge
                              variant={
                                booking.status === "completed" ? "default" : "destructive"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(booking.tripDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              Booked: {format(new Date(booking.bookingDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                          {booking.details && (
                            <p className="text-sm text-muted-foreground">{booking.details}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Account Information Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Full Name</p>
                      <p className="text-muted-foreground">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Name cannot be changed after signup
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed after signup
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">Old Password</Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
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

            {/* Testimonials Tab */}
            <TabsContent value="testimonials">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Testimonial</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Share your experience with StoriesByFoot. Your testimonials help other travelers discover amazing adventures.
                  </p>
                  <Button onClick={() => navigate("/testimonials#add-testimonial-form")}>
                    Go to Testimonials Page
                  </Button>
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

export default Dashboard;
