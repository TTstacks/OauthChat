import { AfterViewChecked, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { AsyncPipe } from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import { Subscription } from 'rxjs';
import { Route, Router } from '@angular/router';
import { Message } from '../message';
import { User } from '../user';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageArea') messageArea!: ElementRef;
  @ViewChild('chatView') chatView!: ElementRef;


  private formBuilder = inject(FormBuilder);
  messageForm = this.formBuilder.group({
    text: ['', Validators.required]
  });

  user$ = this.supabaseService.currentUser;
  user!: User;
  subscriber!: Subscription;
  messages: Message[] = [];
  channel = this.supabaseService.chatChannel;

  constructor(private supabaseService: SupabaseService, private router: Router){}

  ngOnInit(): void {
    this.supabaseService.getMessages().subscribe(
      {
        next: (value)=>{
          this.messages = (value.data as unknown as Message[]).reverse();
        },
        error: ()=>{

        }
      }
    );
    this.subscriber = this.user$.subscribe({
      next:(value)=>{
        if(value === null) {
          this.router.navigateByUrl('/login');
        }
        else if(value){
          this.user = value;
        }
      }
    });
    const changes = this.channel.on(
      'postgres_changes',
      {event: '*', schema: 'public', table: 'message'},
      (payload)=>{
        const data = payload.new as any;
        this.supabaseService.getProfile(data.user_id).subscribe({
          next: (value)=>{
            const message: Message = {
              text: data.text,
              profile: {
                id: data.user_id,
                full_name: value.data?.full_name,
                avatar_url: value.data?.avatar_url,
              }
            }
            this.messages.push(message);
          }
        })
      }
    ).subscribe();
  }

  scrollBottom(){
    let element = (this.chatView.nativeElement as HTMLDivElement);
    if( element.scrollHeight - element.scrollTop >= element.offsetHeight * 2) return;
    element.scrollTop = element.scrollHeight;
  }

  ngAfterViewChecked(): void {
    this.scrollBottom();
  }
  

  messageInputGrow(event: Event){
      const textarea = event.target as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
      
  }

  submit(){
    const {text} = this.messageForm.getRawValue();
    if(text == '' || text == null) return;
    this.supabaseService.sendMessage(text);
    this.messageArea.nativeElement.value = null;
    this.messageArea.nativeElement.style.height= 'auto';
  }

  ngOnDestroy(): void {
    this.subscriber.unsubscribe(); 
  }
}
