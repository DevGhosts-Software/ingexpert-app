import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/theme/mode-toggle';

export default function Home() {
  return (
    <div>
      <ModeToggle />
      <Button>Click me</Button>
    </div>
  );
}
