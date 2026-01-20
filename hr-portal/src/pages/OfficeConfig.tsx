import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Wifi, Ruler, Clock } from "lucide-react";

const OfficeConfig = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        lat: "",
        lng: "",
        radius: "",
        bssid: "",
        workingHours: "",
        officeStartTime: ""
    });

    useEffect(() => {
        fetch("http://localhost:5000/api/config/office")
            .then(res => res.json())
            .then(data => {
                setFormData({
                    lat: data.lat || "",
                    lng: data.lng || "",
                    radius: data.radius || "",
                    bssid: data.bssid || "",
                    workingHours: data.workingHours || "8",
                    officeStartTime: data.officeStartTime || "09:00"
                });
            })
            .catch(err => console.error("Error fetching config:", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/config/office", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success("Office configuration updated successfully!");
            } else {
                toast.error("Failed to update configuration");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="font-display text-3xl font-bold text-foreground">Office Configuration</h1>
                <p className="text-muted-foreground">Configure office location and WiFi settings for attendance validation</p>
            </div>

            {/* Info Card */}
            <Card className="border-l-4 border-l-info bg-info/5">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-info mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-foreground mb-1">How Validation Works</p>
                            <p className="text-muted-foreground">
                                Employees must be <strong>within the specified radius</strong> of the office location to punch in.
                                WiFi BSSID is tracked for reporting but doesn't affect punch-in approval.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Configuration Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Office Settings</CardTitle>
                    <CardDescription>Update the office location, allowed radius, and WiFi configuration</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Location Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold">Office Location</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lat">Latitude</Label>
                                    <Input
                                        id="lat"
                                        name="lat"
                                        type="number"
                                        step="any"
                                        placeholder="12.9716"
                                        value={formData.lat}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Example: 12.9716 (Bangalore)</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lng">Longitude</Label>
                                    <Input
                                        id="lng"
                                        name="lng"
                                        type="number"
                                        step="any"
                                        placeholder="77.5946"
                                        value={formData.lng}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Example: 77.5946 (Bangalore)</p>
                                </div>
                            </div>
                        </div>

                        {/* Radius Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Ruler className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold">Allowed Radius</h3>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="radius">Radius (meters)</Label>
                                <Input
                                    id="radius"
                                    name="radius"
                                    type="number"
                                    placeholder="100"
                                    value={formData.radius}
                                    onChange={handleChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Recommended: 100m for strict validation, 500m for lenient. Current: <strong>{formData.radius || '—'}m</strong>
                                </p>
                            </div>
                        </div>

                        {/* WiFi Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Wifi className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold">WiFi Configuration</h3>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bssid">WiFi BSSID (MAC Address)</Label>
                                <Input
                                    id="bssid"
                                    name="bssid"
                                    placeholder="AA:BB:CC:DD:EE:FF"
                                    value={formData.bssid}
                                    onChange={handleChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    The MAC address of your office WiFi router. Format: XX:XX:XX:XX:XX:XX (e.g., 00:13:10:85:fe:01)
                                </p>
                            </div>
                        </div>

                        {/* Working Hours Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold">Working Hours</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="workingHours">Total Working Hours</Label>
                                    <Input
                                        id="workingHours"
                                        name="workingHours"
                                        type="number"
                                        min="1"
                                        max="24"
                                        placeholder="8"
                                        value={formData.workingHours}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Full day hours (e.g., 8 for 8-hour workday)</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="officeStartTime">Office Start Time</Label>
                                    <Input
                                        id="officeStartTime"
                                        name="officeStartTime"
                                        type="time"
                                        placeholder="09:00"
                                        value={formData.officeStartTime}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Official start time (e.g., 09:00)</p>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Saving..." : "Save Configuration"}
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OfficeConfig;
