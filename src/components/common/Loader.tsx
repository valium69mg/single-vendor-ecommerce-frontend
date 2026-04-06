import { Spinner } from "../ui/spinner";
export default function Loader() {
  return (
    <div className="flex items-center justify-center h-48">
      <Spinner />
    </div>
  );
}
