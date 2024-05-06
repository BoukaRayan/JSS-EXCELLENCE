const memberModel = require('../models/memberModel');
const paymentModel = require('../models/paymentModel');
const settingModel = require('../models/settingModel');
const QRCode = require('qrcode');
const multer = require('multer');
const moment = require('moment-timezone');

// Configuration de Multer pour stocker les images dans le dossier "images"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../public/images/membres'); // Dossier de destination
  },
  filename: (req, file, cb) => {
    const ext = '.jpeg'; // Extension fixe
    const filename = 'm_' + req.body.nom + '_' + req.body.prenom + ext; // Nom du fichier basé sur le nom et le prénom
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

// A verifier apres le cas des membres supprimes logiquement 
async function addMember(req, res){
    try {
      const newMember = req.body;

      const member = await memberModel.getMemberByName(newMember.nom,newMember.prenom);
      if (member) {
      res.json({ success: false, message: 'Nom du membre déjà utilisé' });
      } else {
      await memberModel.addMember(newMember);
      res.json({ success: true, message: 'Membre ajouté avec succès' });
   }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre :', error);
      res.json({ success: false, message: 'Erreur lors de l\'ajout du membre' });
    }
  }



async function deleteMember(req, res) {
    try {
      const id = req.params.id;  
      await memberModel.deleteMemberById(id);
      res.json({ success: true, message: 'Membre supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du membre :', error);
      res.json({ success: false, message: 'Erreur lors de la suppression du membre' });
    }
  }

  async function getAllMembers(req, res){
    try {
      const members = await memberModel.getAllMembers(); 
      members.forEach(member => {
      member.date_naissance = moment(member.date_naissance).format('YYYY-MM-DD');
      member.date_inscription = moment(member.date_inscription).format('YYYY-MM-DD');
       });
      res.json({ success: true, members });
    } catch (error) {
      res.json({ success: false, message: 'Erreur lors de la récupération des membres.', error: error.message });
    }
  }
  
  async function getMember(req, res) {
    try {
      const memberId = req.params.id;
      const member = await memberModel.getMemberById(memberId);
  
      if (member) {
        if (member.etat_abonnement == 'Payé') {
          const transaction = await memberModel.getTransaction(memberId);
          member.id_paiement = transaction.id_paiement;
          transaction.date_abonnement = moment(transaction.date_paiement).format('YYYY-MM-DD');
          transaction.mois_abonnement = transaction.mois ;
          delete transaction.mois;
          delete transaction.date_paiement;
          member.transaction = transaction;
        } else {
          const lastTransaction = await memberModel.getLastTransactionBeforeCurrentMonth(memberId);
          if (lastTransaction) {
            member.id_paiement = lastTransaction.id_paiement;
            lastTransaction.date_abonnement = moment(lastTransaction.date_paiement).format('YYYY-MM-DD');
            lastTransaction.mois_abonnement = lastTransaction.mois;
            delete lastTransaction.mois;
            delete lastTransaction.date_paiement;
            member.transaction = lastTransaction;
          }
          else{
            member.id_paiement = null;
          }
        }
        // Ajouter le nom du sport pour chaque groupe
        for (const groupe of member.groupes) {
          const groupeDetail = await memberModel.getGroupeDetail(groupe.id_groupe);
          groupe.nom_sport = groupeDetail.nom_sport;
        }
        member.date_naissance = moment(member.date_naissance).format('YYYY-MM-DD');
        member.date_inscription = moment(member.date_inscription).format('YYYY-MM-DD');
  
        res.json({ success: true, member });
      } else {
        res.json({ success: false, message: 'Membre non trouvé' });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du membre :', error);
      res.json({ success: false, message: 'Erreur lors de la récupération du membre' });
    }
  }



  async function updateMember(req, res) {
    try {
      const memberId = req.params.id;
      const newMemberData = req.body;
  
      // on verifie si le nouveau nom du membre existe déjà pour d'autres membres
      const memberExists = await memberModel.checkMember(newMemberData.nom, newMemberData.prenom, memberId);
      if (memberExists) {
        return res.json({ success: false, message: 'Le nouveau nom du membre existe déjà pour un autre member' });
      }
      await memberModel.updateMember(memberId, newMemberData);
      res.json({ success: true, message: 'membre modifié avec succès' });
    } catch (error) {
      console.error('Erreur lors de la modification du membre :', error);
      res.json({ success: false, message: 'Erreur lors de la modification du membre' });
    }
  }

  async function assignMemberToGroups(req, res) {
    try {
      const memberId = req.params.id;
      const  { groupIds }  = req.body;
      if (groupIds && groupIds.length > 0) {
        await memberModel.assignMemberToGroups(memberId, groupIds); 
        res.json({ success: true, message: 'Membre assigné aux groupes avec succès' });
      }      
      else{
        res.json({ success: false, message: 'Veuillez sélectionner au moins un groupe' });
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation du membre aux groupes :', error);
      res.json({ success: false, message: 'Erreur lors de l\'assignation du membre aux groupes' });
    }
  }

  async function assignMemberToGroup(req, res) {
    try {
        const memberId = req.params.id;
        const {groupId} = req.body;

        // Vérifier si le membre appartient déjà au groupe
        const isMemberAssigned = await memberModel.isMemberAssignedToGroup(memberId, groupId);

        if (isMemberAssigned) {
            res.json({ success: false, message: 'Le membre est déjà assigné à ce groupe' });
        } else {
            await memberModel.assignMemberToGroup(memberId, groupId);
            res.json({ success: true, message: 'Membre assigné au groupe avec succès' });
        }
    } catch (error) {
        console.error('Erreur lors de l\'assignation du membre au groupe :', error);
        res.json({ success: false, message: 'Erreur lors de l\'assignation du membre au groupe' });
    }
}

  
  async function deleteGroupMember(req, res) {
    try {
      const memberId = req.params.id;
      const {groupId} = req.body;
      await memberModel.deleteGroupMember(memberId, groupId);
      res.json({ success: true, message: 'Membre retiré du groupe avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du membre du groupe :', error);
      res.json({ success: false, message: 'Erreur lors de la suppression du membre du groupe' });
    }
  }

  async function DefinitivelyDeleteMember(req, res) {
    try {
      const id = req.params.id;  
      await memberModel.DefinitivelyDeleteMember(id);
      res.json({ success: true, message: 'Membre supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du membre :', error);
      res.json({ success: false, message: 'Erreur lors de la suppression du membre' });
    }
  }
  
  async function getAllDeletedMembers(req, res){
    try {
      const members = await memberModel.getAllDeletedMembers(); 
      members.forEach(member => {
      member.date_naissance = moment(member.date_naissance).format('YYYY-MM-DD');
      member.date_inscription = moment(member.date_inscription).format('YYYY-MM-DD');
       });
      res.json({ success: true, members });
    } catch (error) {
      res.json({ success: false, message: 'Erreur lors de la récupération des membres.', error: error.message });
    }
  }

  async function restoreMember(req, res) {
    try {
      const id = req.params.id;  
      await memberModel.restoreMember(id);
      res.json({ success: true, message: 'Membre restauré avec succès' });
    } catch (error) {
      console.error('Erreur lors de la restauration du membre :', error);
      res.json({ success: false, message: 'Erreur lors de la restauration du membre' });
    }
  }

  async function DefinitivelyDeleteAllMembers(req, res) {
    try {
      await memberModel.DefinitivelyDeleteAllMembers();
      res.json({ success: true, message: 'Membres supprimés avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression des membres :', error);
      res.json({ success: false, message: 'Erreur lors de la suppression des membres' });
    }
  }

  async function sendQrCodeByEmail(req, res) {
    try {
        const memberId = req.params.id;
        const member = await paymentModel.getMemberById(memberId);
        if (member) {
            const text = member.nom + '_' + member.prenom + '_' + memberId;
            const options = {
              width: 300,  
              height: 300  
            };
            QRCode.toDataURL(text, options, async (err, qrCodeUrl) => {
                if (err) {
                    console.error(err);
                    res.json({ success: false, message: 'Erreur lors de la génération du code QR' });
                    return;
                }
                // Envoyer le code QR par e-mail ici
                const parametres = await settingModel.getParametres();
                await memberModel.sendQrCodeByEmail(member.email , qrCodeUrl, parametres,member.nom,member.prenom);
                res.json({ success: true, message: 'Code QR envoyé par email avec succès' });
            });
        } else {
            res.json({ success: false, message: 'Membre non trouvé' });
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du code QR par email :', error);
        res.json({ success: false, message: 'Erreur lors de l\'envoi du code QR par email' });
    }
}

  module.exports = {
    addMember,
    deleteMember,
    getAllMembers,
    getMember,
    updateMember,
    assignMemberToGroups,
    assignMemberToGroup,
    deleteGroupMember,
    DefinitivelyDeleteMember,
    getAllDeletedMembers,
    restoreMember,
    DefinitivelyDeleteAllMembers,
    sendQrCodeByEmail
}