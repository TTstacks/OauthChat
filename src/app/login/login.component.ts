import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit{

  subscriber: Subscription | null = null;

  constructor(private supabaseService: SupabaseService, private router: Router){}

  ngOnInit(): void {
    const body = <HTMLDivElement>document.body;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    body.appendChild(script);
    (window as any).handleGoogleSignIn = async (response: any) =>{
      const { data, error } = await this.supabaseService.googleSignin(response);
    }
    this.subscriber = this.supabaseService.currentUser.subscribe({next:(user)=>{
      if(user){
        this.router.navigateByUrl('/');
      }
    }});
  }

  ngOnDestroy(): void {
    if(this.subscriber) {
      this.subscriber.unsubscribe();
    }
  }
  
  ngAfterViewInit(): void {
    
  }
 
}
