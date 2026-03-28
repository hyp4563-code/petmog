import { motion } from 'motion/react';

export default function ConfirmationDialog({ title, message, onConfirm, onCancel }: { title: string, message: string, onConfirm: () => void, onCancel: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white w-full rounded-3xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-black text-brand-peach-800 mb-2">{title}</h3>
        <p className="text-sm text-brand-peach-600 mb-6">{message}</p>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 bg-brand-peach-50 text-brand-peach-800 font-bold py-3 rounded-xl">キャンセル</button>
          <button onClick={onConfirm} className="flex-1 bg-brand-rose text-white font-black py-3 rounded-xl">実行する</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
