import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ModernToggleShowcase = () => {
  const [toggleStates, setToggleStates] = useState({
    main: false,
    success: false,
    warning: false,
    danger: false,
    info: false,
    compact: false,
    standard: false,
    large: false,
    legacy: false,
    notifications: true,
    sound: false,
    darkMode: false
  });

  const handleToggle = (key: string) => {
    setToggleStates(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-blue-50/50 dark:from-gray-900 dark:via-background dark:to-blue-950/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Modern Toggle Switches
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Beautiful, animated toggle switches with glassmorphism design, perfect for your Bauplan Buddy app
          </p>
        </div>

        {/* Main Feature Toggle */}
        <Card className="bg-gradient-to-r from-primary/10 to-blue-100/50 dark:from-primary/20 dark:to-blue-900/20 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">App Status Control</CardTitle>
            <CardDescription>
              Main application toggle with enhanced visual feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Switch
              style="modern"
              variant="default"
              size="md"
              animated={true}
              glowing={true}
              checked={toggleStates.main}
              onCheckedChange={() => handleToggle('main')}
            />
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-lg font-medium">
                <span className={`inline-block w-3 h-3 rounded-full ${
                  toggleStates.main ? 'bg-green-500 animate-pulse' : 'bg-red-400'
                }`} />
                <span className={toggleStates.main ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {toggleStates.main ? 'System Active' : 'System Inactive'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toggleStates.main ? 'All systems operational' : 'Click to activate'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variant Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Toggle Variants</CardTitle>
            <CardDescription>
              Different variants for various use cases and states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Success Variant */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Success
                </Badge>
                <Switch
                  style="modern"
                  variant="success"
                  size="compact"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.success}
                  onCheckedChange={() => handleToggle('success')}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Backup Enabled</p>
                  <p className="text-xs text-muted-foreground">
                    {toggleStates.success ? 'Auto-backup active' : 'Manual backup only'}
                  </p>
                </div>
              </div>

              {/* Warning Variant */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200/50 dark:border-yellow-800/30">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Warning
                </Badge>
                <Switch
                  style="modern"
                  variant="warning"
                  size="compact"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.warning}
                  onCheckedChange={() => handleToggle('warning')}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Debug Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {toggleStates.warning ? 'Detailed logging on' : 'Standard logging'}
                  </p>
                </div>
              </div>

              {/* Danger Variant */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30">
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Danger
                </Badge>
                <Switch
                  style="modern"
                  variant="danger"
                  size="compact"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.danger}
                  onCheckedChange={() => handleToggle('danger')}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Admin Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {toggleStates.danger ? 'Full access granted' : 'Restricted access'}
                  </p>
                </div>
              </div>

              {/* Info Variant */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Info
                </Badge>
                <Switch
                  style="modern"
                  variant="info"
                  size="compact"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.info}
                  onCheckedChange={() => handleToggle('info')}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Tutorial Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {toggleStates.info ? 'Help tips visible' : 'Clean interface'}
                  </p>
                </div>
              </div>

              {/* Notifications Example */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Notifications
                </Badge>
                <Switch
                  style="modern"
                  variant="default"
                  size="compact"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.notifications}
                  onCheckedChange={() => handleToggle('notifications')}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {toggleStates.notifications ? 'Real-time alerts' : 'Silent mode'}
                  </p>
                </div>
              </div>

              {/* Sound Example */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-950/20 border border-gray-200/50 dark:border-gray-800/30">
                <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  Audio
                </Badge>
                <Switch
                  style="modern"
                  variant="default"
                  size="compact"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.sound}
                  onCheckedChange={() => handleToggle('sound')}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Sound Effects</p>
                  <p className="text-xs text-muted-foreground">
                    {toggleStates.sound ? 'Audio feedback on' : 'Silent operation'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Size Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Size Variations</CardTitle>
            <CardDescription>
              Different sizes for various UI contexts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Compact */}
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-lg font-semibold">Compact</h3>
                <Switch
                  style="modern"
                  variant="success"
                  size="compact"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.compact}
                  onCheckedChange={() => handleToggle('compact')}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Perfect for dense layouts and settings panels
                </p>
              </div>

              {/* Standard */}
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-lg font-semibold">Standard</h3>
                <Switch
                  style="modern"
                  variant="info"
                  size="md"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.standard}
                  onCheckedChange={() => handleToggle('standard')}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Ideal for main controls and feature toggles
                </p>
              </div>

              {/* Small (Legacy size) */}
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-lg font-semibold">Small</h3>
                <Switch
                  style="modern"
                  variant="warning"
                  size="sm"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.large}
                  onCheckedChange={() => handleToggle('large')}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Great for inline controls and compact interfaces
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legacy Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Legacy vs Modern Comparison</CardTitle>
            <CardDescription>
              See the difference between old and new toggle designs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Legacy Style */}
              <div className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Legacy Style</h3>
                <Switch
                  style="default"
                  size="compact"
                  radius="md"
                  checked={toggleStates.legacy}
                  onCheckedChange={() => handleToggle('legacy')}
                />
                <p className="text-sm text-gray-500 text-center">
                  Basic toggle without animations or gradients
                </p>
              </div>

              {/* Modern Style */}
              <div className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-gradient-to-br from-primary/10 to-blue-100/50 dark:from-primary/20 dark:to-blue-900/20">
                <h3 className="text-lg font-semibold">Modern Style</h3>
                <Switch
                  style="modern"
                  variant="default"
                  size="compact"
                  animated={true}
                  glowing={true}
                  checked={toggleStates.legacy}
                  onCheckedChange={() => handleToggle('legacy')}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Enhanced with gradients, animations, and glow effects
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Code */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation</CardTitle>
            <CardDescription>
              How to use the modern toggles in your components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  <code>{`<Switch
  style="modern"
  variant="success"
  size="compact"
  animated={true}
  glowing={true}
  checked={enabled}
  onCheckedChange={setEnabled}
/>`}</code>
                </pre>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Available Variants:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <code>default</code> - Red/Blue gradient</li>
                    <li>• <code>success</code> - Green gradient</li>
                    <li>• <code>warning</code> - Yellow/Orange gradient</li>
                    <li>• <code>danger</code> - Red gradient</li>
                    <li>• <code>info</code> - Blue/Cyan gradient</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Available Sizes:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <code>compact</code> - 30×60px</li>
                    <li>• <code>sm</code> - 32×64px</li>
                    <li>• <code>md</code> - 40×80px</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernToggleShowcase;