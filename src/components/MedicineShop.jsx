import { useGame } from '../context/GameContext'
import { getAllMedicines } from '../utils/items'
import './MedicineShop.css'

function MedicineShop({ onClose }) {
  const { money, setMoney, inventory, setInventory } = useGame()
  const medicines = getAllMedicines()

  const buyMedicine = (medicine) => {
    if (money < medicine.price) {
      alert('金钱不足！')
      return
    }

    setMoney(money - medicine.price)
    setInventory({
      ...inventory,
      [medicine.id]: (inventory[medicine.id] || 0) + 1
    })
    alert(`购买了 ${medicine.name}！`)
  }

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content shop-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>药品商店</h2>
        <div className="shop-info">
          <p>当前金钱: <span className="money">{money}</span> 文</p>
        </div>
        <div className="shop-items">
          {medicines.map(medicine => (
            <div key={medicine.id} className="shop-item">
              <div className="item-icon">{medicine.icon}</div>
              <div className="item-info">
                <div className="item-name">{medicine.name}</div>
                <div className="item-desc">{medicine.description}</div>
                <div className="item-price">价格: {medicine.price} 文</div>
                <div className="item-count">拥有: {inventory[medicine.id] || 0}</div>
              </div>
              <button
                className="btn-buy"
                onClick={() => buyMedicine(medicine)}
                disabled={money < medicine.price}
              >
                购买
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MedicineShop

