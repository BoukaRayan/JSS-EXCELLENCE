const expenseModel = require('../models/expenseModel');

  async function addExpense(req, res) {
    try {
      const { nom, type, montant, date, description, facture } = req.body;
      await expenseModel.addExpense(nom, type, montant, date, description, facture);
      res.json({ success: true, message: 'Dépense ajoutée avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la dépense :', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de la dépense' });
    }
  }
  
  
  async function deleteExpense(req, res) {
    try {
      const id = req.params.id;
      await expenseModel.deleteExpenseById(id);
      res.json({ success: true, message: 'Dépense supprimée avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense :', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la dépense' });
    }
  }


  async function updateExpense(req, res) {
    try {
      const depenseId = req.params.id;
      const { nom, type, montant, date, description, facture } = req.body;
      await expenseModel.updateExpenseById(depenseId, nom, type, montant, date, description, facture);
      res.json({ success: true, message: 'Dépense mise à jour avec succès' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dépense :', error);
      res.json({ success: false, message: 'Erreur lors de la mise à jour de la dépense' });
    }
  }

  async function getAllExpenses(req, res) {
    try {
       const depenses = await expenseModel.getAllExpenses();
       depenses.forEach(depense => {
        depense.date = new Date(depense.date).toLocaleDateString();
       });
       res.json({ success: true, depenses });
    } catch (error) {
       res.json({ success: false, message: 'Erreur lors de la récupération des depenses.', error: error.message });
    }
  }
  
  module.exports = {
    addExpense,
    deleteExpense,
    updateExpense,
    getAllExpenses
  };