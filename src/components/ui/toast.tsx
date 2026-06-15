import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-neutral-900 group-[.toaster]:text-neutral-100 group-[.toaster]:border-neutral-700 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-neutral-400',
          success:
            'group-[.toaster]:bg-green-900 group-[.toaster]:text-green-100 group-[.toaster]:border-green-700',
          error:
            'group-[.toaster]:bg-red-900 group-[.toaster]:text-red-100 group-[.toaster]:border-red-700',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
