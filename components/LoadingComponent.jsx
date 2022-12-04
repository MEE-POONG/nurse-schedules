export default function LoadingComponent() {
    return (
        <div className="absolute right-1/2 bottom-1/2  transform translate-x-1/2 translate-y-1/2 ">
            <div className="border-t-transparent border-solid animate-spin rounded-full border-green-700 border-8 h-64 w-64"></div>
        </div>
    );
}